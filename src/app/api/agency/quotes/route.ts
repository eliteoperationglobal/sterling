import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";

/**
 * GET /api/agency/quotes
 * Get all quotes for the authenticated agency
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

    await connectDB();
    
    // Ensure models are registered before population
    await import("@/models/Submission");
    await import("@/models/Carrier");

    const agencyId = (session.user as any).agencyId;

    // Get all submissions for this agency
    const submissions = await Submission.find({ agencyId }).select("_id").lean();
    const submissionIds = submissions.map((s) => s._id);

    // Get status filter from query params
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    
    // Build query
    // Agencies should only see POSTED, APPROVED, BIND_REQUESTED, and BOUND quotes (not ENTERED)
    const query: any = {
      submissionId: { $in: submissionIds },
      status: { $in: ["POSTED", "APPROVED", "BIND_REQUESTED", "BOUND"] }, // Exclude ENTERED
    };
    
    // Filter by specific status if provided
    if (status && status !== "ALL") {
      if (status === "POSTED") {
        query.status = "POSTED";
      } else if (status === "APPROVED") {
        query.status = "APPROVED";
      } else if (status === "BIND_REQUESTED") {
        query.status = "BIND_REQUESTED";
      } else if (status === "BOUND") {
        query.status = "BOUND";
      } else {
        // For any other status, still respect the exclusion of ENTERED
        query.status = status;
      }
    }

    // Get quotes for these submissions
    const quotes = await Quote.find(query)
      .populate("submissionId", "clientContact status esignCompleted paymentStatus")
      .populate("carrierId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedQuotes = quotes.map((quote: any) => ({
      _id: quote._id.toString(),
      submissionId: quote.submissionId._id.toString(),
      carrierId: quote.carrierId._id.toString(),
      carrierName: quote.carrierId.name,
      clientName: quote.submissionId.clientContact?.name || "N/A",
      carrierQuoteUSD: quote.carrierQuoteUSD,
      // No wholesale fee - removed per user request
      brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
      premiumTaxPercent: quote.premiumTaxPercent,
      premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
      policyFeeUSD: quote.policyFeeUSD || 0,
      finalAmountUSD: quote.finalAmountUSD,
      status: quote.status,
      submissionStatus: quote.submissionId.status,
      esignCompleted: quote.submissionId.esignCompleted || false,
      paymentStatus: quote.submissionId.paymentStatus || "PENDING",
      binderPdfUrl: quote.binderPdfUrl,
      createdAt: quote.createdAt,
    }));

    return NextResponse.json({
      quotes: formattedQuotes,
      count: formattedQuotes.length,
    });
  } catch (error: any) {
    console.error("Agency quotes fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

