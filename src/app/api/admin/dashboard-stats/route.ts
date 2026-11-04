export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";

/**
 * GET /api/admin/dashboard-stats
 * Fast single-query endpoint for Admin Dashboard metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const CancelRequest = (await import("@/models/CancelRequest")).default;

    const [
      totalSubmissions,
      quoteRequests,
      boundPoliciesCount,
      cancelledPoliciesCount,
      cancelRequests,
      pendingQuotesList
    ] = await Promise.all([
      Submission.countDocuments({}),
      Submission.countDocuments({ status: "SUBMITTED" }),
      Submission.countDocuments({ bindApproved: true, status: { $ne: "CANCELLED" } }),
      Submission.countDocuments({ status: "CANCELLED" }),
      (CancelRequest as any).find({ status: "PENDING" }).select("status createdAt submissionId").sort({ createdAt: -1 }).lean(),
      Quote.find({ status: "BIND_REQUESTED" }).select("submissionId").lean(),
    ]);

    const pendingQuotesCount = pendingQuotesList.length;
    const submissionIdsWithPendingQuotes = pendingQuotesList.map((q: any) => q.submissionId);

    const bindRequestsCount = await Submission.countDocuments({
      $or: [
        { bindRequested: true, bindApproved: false },
        { _id: { $in: submissionIdsWithPendingQuotes } }
      ]
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions,
        pendingQuotes: pendingQuotesCount,
        quoteRequests,
        bindRequests: bindRequestsCount,
        boundPolicies: boundPoliciesCount,
        cancelledPolicies: cancelledPoliciesCount,
      },
      cancelRequests: cancelRequests.map((r: any) => ({
        ...r,
        _id: r._id.toString(),
        submissionId: r.submissionId?.toString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
