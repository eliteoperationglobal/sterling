import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";
import Submission from "@/models/Submission";

/**
 * GET /api/admin/submissions/[id]/activity
 * Get activity logs for a submission (Admin version)
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

    // Only system_admin can access admin activity
    const userRole = (session?.user as any)?.role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Verify submission exists
    const submission = await Submission.findById(params.id).lean();

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
    console.error("Admin activity log API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
