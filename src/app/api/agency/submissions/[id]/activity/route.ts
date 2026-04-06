import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";
import Submission from "@/models/Submission";

/**
 * GET /api/agency/submissions/[id]/activity
 * Get activity logs for a submission
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

    await connectDB();

    // Verify submission belongs to agency
    const submission = await Submission.findOne({
      _id: params.id,
      agencyId: (session.user as any).agencyId,
    }).lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get activity logs for this submission
    const logs = await ActivityLog.find({
      submissionId: params.id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        _id: log._id.toString(),
        submissionId: log.submissionId?.toString(),
        quoteId: log.quoteId?.toString(),
        activityType: log.activityType,
        description: log.description,
        details: log.details || {},
        performedBy: log.performedBy,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Activity log API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

