import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import FormTemplate from "@/models/FormTemplate";
import RoutingLog from "@/models/RoutingLog";
import Quote from "@/models/Quote";

/**
 * GET /api/admin/submissions/[id]
 * Get submission details for admin (with routing logs and quotes)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    // Only system_admin can access admin APIs
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Import models to ensure they're registered for populate
    await import("@/models/FormTemplate");
    await import("@/models/Agency");
    await import("@/models/Carrier");

    const submission = await Submission.findById(params.id)
      .populate("templateId")
      .populate("agencyId", "name email")
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const ActivityLog = (await import("@/models/ActivityLog")).default;
    const BoundPolicy = (await import("@/models/BoundPolicy")).default;

    // Fetch routing logs, quotes, bound policy, and activity logs concurrently
    const [routingLogs, quotes, boundPolicy, activityLogs] = await Promise.all([
      RoutingLog.find({ submissionId: params.id })
        .populate("carrierId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Quote.find({ submissionId: params.id })
        .populate("carrierId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      (BoundPolicy as any).findOne({ submissionId: params.id }).lean(),
      ActivityLog.find({ submissionId: params.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return NextResponse.json({
      submission: {
        ...submission,
        _id: submission._id.toString(),
        agencyId: submission.agencyId
          ? {
            _id: (submission.agencyId as any)._id.toString(),
            name: (submission.agencyId as any).name,
            email: (submission.agencyId as any).email,
          }
          : null,
        templateId: submission.templateId
          ? {
            _id: (submission.templateId as any)._id.toString(),
            industry: (submission.templateId as any).industry,
            subtype: (submission.templateId as any).subtype,
            title: (submission.templateId as any).title,
          }
          : null,
        programId: (submission as any).programId || null,
        programName: (submission as any).programName || null,
      },
      routingLogs: routingLogs.map((log: any) => ({
        ...log,
        _id: log._id.toString(),
        submissionId: log.submissionId.toString(),
        carrierId: log.carrierId
          ? {
            _id: (log.carrierId as any)._id.toString(),
            name: (log.carrierId as any).name,
            email: (log.carrierId as any).email,
          }
          : null,
      })),
      quotes: quotes.map((quote: any) => {
        const checkedDocs =
          quote.checkedDocuments instanceof Map
            ? Object.fromEntries(quote.checkedDocuments)
            : quote.checkedDocuments || {};

        return {
          ...quote,
          _id: quote._id.toString(),
          submissionId: quote.submissionId.toString(),
          carrierId: quote.carrierId
            ? {
              _id: (quote.carrierId as any)._id.toString(),
              name: (quote.carrierId as any).name,
              email: (quote.carrierId as any).email,
            }
            : null,
          checkedDocuments: checkedDocs,
        };
      }),
      boundPolicy: boundPolicy || null,
      activityLogs: activityLogs || [],
    });
  } catch (error: any) {
    console.error("Submission details error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/submissions/[id]
 * Delete a submission and all related data (Quotes, RoutingLogs, ActivityLogs, BoundPolicies)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const submissionId = params.id;
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Attempt to delete S3 files if we have the S3Client dependencies
    try {
      const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
      if (process.env.B2_REGION && process.env.B2_ENDPOINT && process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY) {
        const s3Client = new S3Client({
          region: process.env.B2_REGION,
          endpoint: process.env.B2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.B2_KEY_ID,
            secretAccessKey: process.env.B2_APPLICATION_KEY,
          },
        });

        const bucketName = process.env.B2_BUCKET_NAME || "sterling-uploads";
        const prefix = `submissions/${submissionId}/`;

        const listParams = { Bucket: bucketName, Prefix: prefix };
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
          const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })) }
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
          console.log(`Deleted ${listedObjects.Contents.length} files from S3 for submission ${submissionId}`);
        }
      }
    } catch (s3Error) {
      console.error("Failed to delete S3 files, but proceeding with DB deletion:", s3Error);
    }

    // Delete related DB records
    const ActivityLog = (await import("@/models/ActivityLog")).default;
    const BoundPolicy = (await import("@/models/BoundPolicy")).default;

    await Promise.all([
      Quote.deleteMany({ submissionId: submissionId }),
      RoutingLog.deleteMany({ submissionId: submissionId }),
      ActivityLog.deleteMany({ submissionId: submissionId }),
      BoundPolicy.deleteMany({ submissionId: submissionId }),
      Submission.findByIdAndDelete(submissionId)
    ]);

    return NextResponse.json({ message: "Submission successfully deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Submission deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete submission" },
      { status: 500 }
    );
  }
}
