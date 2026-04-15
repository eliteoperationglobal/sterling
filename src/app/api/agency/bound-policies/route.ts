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

    // Fetch all bound submissions for this agency
    const submissions = await Submission.find({
      agencyId,
      status: "BOUND",
      bindApproved: true,
    })
      .sort({ bindApprovedAt: -1 })
      .lean();

    // Fetch quotes for each submission
    const policiesWithQuotes = await Promise.all(
      submissions.map(async (submission) => {
        const quote = await Quote.findOne({ submissionId: submission._id })
          .populate("carrierId", "name")
          .lean();

        return {
          ...submission,
          quote: quote ? {
            _id: quote._id.toString(),
            carrierName: (quote.carrierId as any)?.name || "Unknown Carrier",
            finalAmountUSD: quote.finalAmountUSD,
            effectiveDate: quote.effectiveDate,
            expirationDate: quote.expirationDate,
            policyNumber: quote.policyNumber,
          } : null,
        };
      })
    );

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
