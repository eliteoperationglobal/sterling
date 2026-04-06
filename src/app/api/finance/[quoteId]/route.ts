import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import FinancePlan from "@/models/FinancePlan";
import Quote from "@/models/Quote";

/**
 * GET /api/finance/[quoteId]
 * Get finance plan for a specific quote
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { quoteId: string } }
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
    await import("@/models/Quote");

    // Get quote to verify it exists and user has access
    const quote = await Quote.findById(params.quoteId)
      .populate("submissionId")
      .lean();

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this quote
    const userRole = (session.user as any).role;
    const userAgencyId = (session.user as any).agencyId;

    if (userRole !== "system_admin") {
      // Agency users can only see quotes for their agency
      const submission = quote.submissionId as any;
      if (submission.agencyId?.toString() !== userAgencyId?.toString()) {
        return NextResponse.json(
          { error: "Forbidden - You don't have access to this quote" },
          { status: 403 }
        );
      }
    }

    // Get finance plan for this quote
    const financePlan = await FinancePlan.findOne({
      quoteId: params.quoteId,
    }).lean();

    if (!financePlan) {
      return NextResponse.json({
        success: true,
        financePlan: null,
        message: "No finance plan found for this quote",
      });
    }

    return NextResponse.json({
      success: true,
      financePlan: {
        _id: financePlan._id.toString(),
        quoteId: financePlan.quoteId.toString(),
        downPaymentUSD: financePlan.downPaymentUSD,
        tenureMonths: financePlan.tenureMonths,
        annualInterestPercent: financePlan.annualInterestPercent,
        monthlyInstallmentUSD: financePlan.monthlyInstallmentUSD,
        totalPayableUSD: financePlan.totalPayableUSD,
        createdAt: financePlan.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Finance plan fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch finance plan" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/[quoteId]
 * Create or update finance plan for a quote
 * Body: { downPaymentUSD, tenureMonths, annualInterestPercent }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quoteId: string } }
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
    
    // Import models
    await import("@/models/Quote");
    const { calculateEMI } = await import("@/services/FinanceService");

    // Get quote
    const quote = await Quote.findById(params.quoteId).lean();

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if user has access
    const userRole = (session.user as any).role;
    const userAgencyId = (session.user as any).agencyId;

    if (userRole !== "system_admin") {
      // Agency users can only create finance plans for their quotes
      const submission = await (await import("@/models/Submission")).default.findById(
        (quote as any).submissionId
      ).lean();
      
      if ((submission as any)?.agencyId?.toString() !== userAgencyId?.toString()) {
        return NextResponse.json(
          { error: "Forbidden - You don't have access to this quote" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { downPaymentUSD, tenureMonths, annualInterestPercent } = body;

    // Validate input
    if (downPaymentUSD === undefined || downPaymentUSD < 0) {
      return NextResponse.json(
        { error: "downPaymentUSD must be >= 0" },
        { status: 400 }
      );
    }

    if (!tenureMonths || tenureMonths < 1 || tenureMonths > 60) {
      return NextResponse.json(
        { error: "tenureMonths must be between 1 and 60" },
        { status: 400 }
      );
    }

    if (annualInterestPercent === undefined || annualInterestPercent < 0 || annualInterestPercent > 100) {
      return NextResponse.json(
        { error: "annualInterestPercent must be between 0 and 100" },
        { status: 400 }
      );
    }

    const quoteAmount = (quote as any).finalAmountUSD;
    const principalUSD = quoteAmount - downPaymentUSD;

    if (principalUSD <= 0) {
      return NextResponse.json(
        { error: "Down payment cannot exceed quote amount" },
        { status: 400 }
      );
    }

    // Calculate EMI
    const emiResult = calculateEMI(principalUSD, annualInterestPercent, tenureMonths);

    // Create or update finance plan
    const financePlan = await FinancePlan.findOneAndUpdate(
      { quoteId: params.quoteId },
      {
        quoteId: params.quoteId,
        downPaymentUSD,
        tenureMonths,
        annualInterestPercent,
        monthlyInstallmentUSD: emiResult.monthlyEMI,
        totalPayableUSD: downPaymentUSD + emiResult.totalPayable,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      financePlan: {
        _id: financePlan._id.toString(),
        quoteId: financePlan.quoteId.toString(),
        downPaymentUSD: financePlan.downPaymentUSD,
        tenureMonths: financePlan.tenureMonths,
        annualInterestPercent: financePlan.annualInterestPercent,
        monthlyInstallmentUSD: financePlan.monthlyInstallmentUSD,
        totalPayableUSD: financePlan.totalPayableUSD,
        createdAt: financePlan.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Finance plan creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create finance plan" },
      { status: 500 }
    );
  }
}

