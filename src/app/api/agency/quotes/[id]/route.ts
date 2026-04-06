import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";

/**
 * GET /api/agency/quotes/[id]
 * Get a single quote by ID for the authenticated agency
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

    // Ensure models are registered before populate
    await import("@/models/Carrier");
    await import("@/models/Submission");

    const agencyId = (session.user as any).agencyId;

    // Get quote with submission
    const quote = await Quote.findById(params.id)
      .populate("submissionId", "clientContact status esignCompleted esignCompletedAt paymentStatus paymentDate paymentAmount paymentMethod agencyId bindRequested bindRequestedAt bindApproved bindApprovedAt signedDocuments finalPolicyDocuments")
      .populate("carrierId", "name email")
      .lean();

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Verify quote belongs to user's agency
    const submission = quote.submissionId as any;
    if (submission.agencyId.toString() !== agencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      quote: {
        _id: quote._id.toString(),
        submissionId: quote.submissionId._id.toString(),
        carrierId: quote.carrierId._id.toString(),
        carrierName: (quote.carrierId as any).name,
        clientName: submission.clientContact?.name || "N/A",
        carrierQuoteUSD: quote.carrierQuoteUSD,
        // No wholesale fee - removed per user request
        brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
        premiumTaxPercent: quote.premiumTaxPercent,
        premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
        policyFeeUSD: quote.policyFeeUSD || 0,
        finalAmountUSD: quote.finalAmountUSD,
        status: quote.status,
        submissionStatus: submission.status,
        esignCompleted: submission.esignCompleted || false,
        esignCompletedAt: submission.esignCompletedAt,
        paymentStatus: submission.paymentStatus || "PENDING",
        paymentDate: submission.paymentDate,
        paymentAmount: submission.paymentAmount,
        paymentMethod: submission.paymentMethod,
        bindRequested: submission.bindRequested,
        bindRequestedAt: submission.bindRequestedAt,
        bindApproved: submission.bindApproved,
        bindApprovedAt: submission.bindApprovedAt,
        signedDocuments: submission.signedDocuments,
        finalPolicyDocuments: submission.finalPolicyDocuments,
        binderPdfUrl: quote.binderPdfUrl,
        adminNotes: quote.adminNotes,
        specialNotes: quote.specialNotes,
        createdAt: quote.createdAt,
      },
      submission: {
        _id: submission._id.toString(),
        clientContact: submission.clientContact,
        status: submission.status,
        esignCompleted: submission.esignCompleted || false,
        esignCompletedAt: submission.esignCompletedAt,
        paymentStatus: submission.paymentStatus || "PENDING",
        paymentDate: submission.paymentDate,
        paymentAmount: submission.paymentAmount,
        paymentMethod: submission.paymentMethod,
        bindRequested: submission.bindRequested,
        bindRequestedAt: submission.bindRequestedAt,
        bindApproved: submission.bindApproved,
        bindApprovedAt: submission.bindApprovedAt,
        signedDocuments: submission.signedDocuments || [],
        finalPolicyDocuments: submission.finalPolicyDocuments,
      },
    });
  } catch (error: any) {
    console.error("Get quote error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agency/quotes/[id]
 * Update a quote (e.g., broker fee)
 * Body: { brokerFeeAmountUSD }
 */
export async function PATCH(
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

    // Only agency users can update quotes
    const userRole = (session.user as any).role;
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: "Forbidden - Agency access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure models are registered before populate
    await import("@/models/Submission");

    const body = await req.json();
    const { brokerFeeAmountUSD } = body;

    // Get quote
    const quote = await Quote.findById(params.id)
      .populate("submissionId", "agencyId");

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Verify quote belongs to user's agency
    const submission = quote.submissionId as any;
    const userAgencyId = (session.user as any).agencyId;

    if (submission.agencyId.toString() !== userAgencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Update broker fee if provided
    if (brokerFeeAmountUSD !== undefined) {
      if (typeof brokerFeeAmountUSD !== "number" || brokerFeeAmountUSD < 0) {
        return NextResponse.json(
          { error: "brokerFeeAmountUSD must be a non-negative number" },
          { status: 400 }
        );
      }

      quote.brokerFeeAmountUSD = brokerFeeAmountUSD;
      // Recalculate final amount (no wholesale fee)
      const taxAmount = quote.premiumTaxAmountUSD || 0;
      const policyFee = quote.policyFeeUSD || 0;
      quote.finalAmountUSD = 
        quote.carrierQuoteUSD + 
        taxAmount +
        policyFee +
        brokerFeeAmountUSD;
    }

    await quote.save();

    return NextResponse.json({
      success: true,
      quote: {
        _id: quote._id.toString(),
        brokerFeeAmountUSD: quote.brokerFeeAmountUSD,
        finalAmountUSD: quote.finalAmountUSD,
      },
    });
  } catch (error: any) {
    console.error("Update quote error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update quote" },
      { status: 500 }
    );
  }
}
