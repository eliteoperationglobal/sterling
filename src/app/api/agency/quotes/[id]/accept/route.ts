import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";

/**
 * POST /api/agency/quotes/[id]/accept
 * Agency accepts a posted quote (POSTED → ACCEPTED_BY_AGENCY)
 * Only works when status == POSTED
 */
export async function POST(
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
    
    // Import models to ensure they're registered
    await import("@/models/Submission");

    const agencyId = (session.user as any).agencyId;
    const userId = (session.user as any).id;

    // Get quote
    const quote = await Quote.findById(params.id).populate("submissionId");
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Verify the quote belongs to the agency
    const submission = quote.submissionId as any;
    if (submission.agencyId.toString() !== agencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Only POSTED quotes can be accepted
    if (quote.status !== "POSTED") {
      return NextResponse.json(
        { error: `Quote must be in POSTED status to be accepted. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Accept the quote
    const acceptedQuote = await Quote.findByIdAndUpdate(
      params.id,
      {
        status: "ACCEPTED_BY_AGENCY",
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      },
      { new: true }
    )
      .populate("submissionId", "clientContact status")
      .populate("carrierId", "name email");

    return NextResponse.json({
      success: true,
      quote: {
        _id: acceptedQuote!._id.toString(),
        submissionId: acceptedQuote!.submissionId._id.toString(),
        carrierId: acceptedQuote!.carrierId._id.toString(),
        carrierName: (acceptedQuote!.carrierId as any).name,
        clientName: (acceptedQuote!.submissionId as any).clientContact?.name || "N/A",
        carrierQuoteUSD: acceptedQuote!.carrierQuoteUSD,
        wholesaleFeePercent: acceptedQuote!.wholesaleFeePercent,
        wholesaleFeeAmountUSD: acceptedQuote!.wholesaleFeeAmountUSD,
        brokerFeeAmountUSD: acceptedQuote!.brokerFeeAmountUSD,
        finalAmountUSD: acceptedQuote!.finalAmountUSD,
        status: acceptedQuote!.status,
        acceptedAt: new Date(),
        createdAt: acceptedQuote!.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Quote acceptance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept quote" },
      { status: 500 }
    );
  }
}






