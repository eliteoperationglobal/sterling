export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";

/**
 * GET /api/agency/bound-policies
 * Get all bound policies for the logged-in agency
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agency users can access
    const userRole = (session.user as any).role;
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: "Forbidden - Agency access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure models are registered
    await import("@/models/Carrier");

    const agencyId = (session.user as any).agencyId;

    // Fetch all bound submissions for this agency with projection
    const submissions = await Submission.find({
      agencyId,
      status: "BOUND",
      bindApproved: true,
    })
      .select("submissionNumber status bindApprovedAt clientContact policyNumber agencyId templateId files applicationPdfUrl payload.companyName payload.applicantName payload.namedInsured payload.carrier payload.totalPremium payload.effectiveDate paymentDate paymentAmount paymentMethod")
      .sort({ bindApprovedAt: -1 })
      .lean();

    // Fetch all quotes in a single batch query (fixes N+1 latency)
    const submissionIds = submissions.map((s) => s._id);
    const quotes = await Quote.find({ submissionId: { $in: submissionIds } })
      .select("submissionId carrierId finalAmountUSD effectiveDate expirationDate policyNumber")
      .populate("carrierId", "name")
      .lean();

    const quoteMap = new Map();
    for (const q of quotes) {
      const subIdStr = q.submissionId.toString();
      if (!quoteMap.has(subIdStr)) {
        quoteMap.set(subIdStr, {
          _id: q._id.toString(),
          carrierName: (q.carrierId as any)?.name || "Unknown Carrier",
          finalAmountUSD: q.finalAmountUSD,
          effectiveDate: q.effectiveDate,
          expirationDate: q.expirationDate,
          policyNumber: q.policyNumber,
        });
      }
    }

    const policiesWithQuotes = submissions.map((submission) => ({
      ...submission,
      quote: quoteMap.get(submission._id.toString()) || null,
    }));

    return NextResponse.json({
      success: true,
      policies: policiesWithQuotes,
      count: policiesWithQuotes.length,
    });
  } catch (error: any) {
    console.error("Agency bound policies error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bound policies" },
      { status: 500 }
    );
  }
}
