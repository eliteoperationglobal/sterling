import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { calculateFinancePlan } from "@/services/FinanceService";

/**
 * POST /api/finance/calculate
 * Calculate EMI and finance schedule
 * Body: { amountUSD, downPaymentPercent, tenureMonths, annualInterestPercent }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amountUSD, downPaymentPercent, tenureMonths, annualInterestPercent } = body;

    // Validate input
    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json(
        { error: "amountUSD must be greater than 0" },
        { status: 400 }
      );
    }

    if (downPaymentPercent === undefined || downPaymentPercent < 0 || downPaymentPercent > 100) {
      return NextResponse.json(
        { error: "downPaymentPercent must be between 0 and 100" },
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

    // Calculate finance plan
    const financePlan = calculateFinancePlan(
      amountUSD,
      downPaymentPercent,
      tenureMonths,
      annualInterestPercent
    );

    return NextResponse.json({
      success: true,
      financePlan: {
        downPaymentUSD: financePlan.downPaymentUSD,
        principalUSD: financePlan.principalUSD,
        tenureMonths,
        annualInterestPercent,
        monthlyInstallmentUSD: financePlan.emiResult.monthlyEMI,
        totalPayableUSD: financePlan.downPaymentUSD + financePlan.emiResult.totalPayable,
        totalInterestUSD: financePlan.emiResult.totalInterest,
        schedule: financePlan.emiResult.schedule,
      },
    });
  } catch (error: any) {
    console.error("Finance calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate finance plan" },
      { status: 500 }
    );
  }
}






