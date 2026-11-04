export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";

/**
 * GET /api/admin/bound-policies
 * Get all submissions with bindApproved = true (bound policies)
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

    // Only system admin can access
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure models are registered
    await import("@/models/Agency");
    await import("@/models/Carrier");

    // Fetch submissions where bindApproved = true with projected fields
    const submissions = await Submission.find({
      bindApproved: true,
    })
      .select("submissionNumber bindApproved bindApprovedAt clientContact policyNumber agencyId templateId files applicationPdfUrl payload.companyName payload.applicantName payload.namedInsured payload.carrier payload.totalPremium payload.effectiveDate")
      .populate("agencyId", "name")
      .populate("templateId", "industry subcategory")
      .sort({ bindApprovedAt: -1 })
      .lean();

    // Get quotes for these submissions with projected fields
    const submissionIds = submissions.map((s) => s._id);
    const quotes = await Quote.find({
      submissionId: { $in: submissionIds },
    })
      .select("submissionId carrierId carrierQuoteUSD premiumTaxAmountUSD policyFeeUSD brokerFeeAmountUSD finalAmountUSD policyNumber policyType status")
      .populate("carrierId", "name")
      .lean();

    // Create a map of submissionId -> quotes array for easy lookup
    const quoteMap = new Map<string, any[]>();
    quotes.forEach((quote: any) => {
      const key = quote.submissionId.toString();
      if (!quoteMap.has(key)) quoteMap.set(key, []);
      quoteMap.get(key)!.push(quote);
    });

    const mapQuote = (q: any) => q ? {
      _id: q._id?.toString(),
      carrierId: q.carrierId ? (q.carrierId._id ? q.carrierId._id.toString() : q.carrierId.toString()) : "",
      carrierName: q.carrierId?.name || "Unknown Carrier",
      carrierQuoteUSD: q.carrierQuoteUSD,
      premiumTaxAmountUSD: q.premiumTaxAmountUSD,
      policyFeeUSD: q.policyFeeUSD,
      brokerFeeAmountUSD: q.brokerFeeAmountUSD,
      finalAmountUSD: q.finalAmountUSD,
      policyNumber: q.policyNumber,
      policyType: q.policyType,
      status: q.status,
    } : null;

    // Combine submission and quote data
    const boundPolicies = submissions.map((submission: any) => {
      const submissionQuotes = quoteMap.get(submission._id.toString()) || [];
      const glQuote = submissionQuotes.find((q: any) => q.policyType === 'GENERAL_LIABILITY') || submissionQuotes.find((q: any) => !q.policyType) || submissionQuotes[0] || null;
      const xlQuote = submissionQuotes.find((q: any) => q.policyType === 'EXCESS_LIABILITY') || null;
      const plQuote = submissionQuotes.find((q: any) => q.policyType === 'PROFESSIONAL_LIABILITY') || null;
      const pollutionQuote = submissionQuotes.find((q: any) => q.policyType === 'POLLUTION_LIABILITY') || null;
      return {
        _id: submission._id.toString(),
        clientContact: submission.clientContact,
        payload: submission.payload,
        clientName: submission.payload?.companyName?.trim() || submission.payload?.applicantName?.trim() || submission.payload?.namedInsured?.trim() || submission.clientContact?.name || "N/A",
        agencyId: submission.agencyId
          ? {
            _id: submission.agencyId._id.toString(),
            name: submission.agencyId.name,
          }
          : null,
        templateId: submission.templateId
          ? {
            _id: submission.templateId._id.toString(),
            industry: submission.templateId.industry,
            subcategory: submission.templateId.subcategory,
          }
          : null,
        status: submission.status,
        bindRequested: submission.bindRequested,
        bindRequestedAt: submission.bindRequestedAt,
        bindApproved: submission.bindApproved,
        bindApprovedAt: submission.bindApprovedAt,
        bindStatus: submission.bindStatus,
        esignCompleted: submission.esignCompleted,
        esignCompletedAt: submission.esignCompletedAt,
        paymentStatus: submission.paymentStatus,
        paymentDate: submission.paymentDate,
        paymentAmount: submission.paymentAmount,
        paymentMethod: submission.paymentMethod,
        quote: mapQuote(glQuote),
        excessQuote: mapQuote(xlQuote),
        professionalQuote: mapQuote(plQuote),
        pollutionQuote: mapQuote(pollutionQuote),
        createdAt: submission.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      policies: boundPolicies,
      count: boundPolicies.length,
    });
  } catch (error: any) {
    console.error("Admin bound policies error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bound policies",
      },
      { status: 500 }
    );
  }
}