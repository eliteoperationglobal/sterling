import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";

/**
 * GET /api/agency/quotes/[id]/activity
 * Get activity logs for a quote
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

    // Get quote and verify it belongs to agency
    const quote = await Quote.findById(params.id)
      .populate("submissionId", "agencyId")
      .lean();

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const submission = quote.submissionId as any;
    if (submission.agencyId.toString() !== (session.user as any).agencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Get activity logs for this quote and its submission
    const logs = await ActivityLog.find({
      $or: [
        { quoteId: params.id },
        { submissionId: submission._id.toString() },
      ],
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

