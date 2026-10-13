export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import {
  calculatePremiumTax,
  calculateStampingFee,
  calculateFireMarshalTax,
  getStampingFeePerFiling,
  getSLAServiceCharge, // ✅ NEW
  getSlasTransactionFee,
  calculateSlasTransactionFee,
} from "@/lib/data/stateTaxRates";

/**
 * Tax Calculator API
 * Supports:
 *  - Premium Tax
 *  - Stamping Fee
 *
 * GET /api/tax/calculate?state=CA&premium=10000&type=premium
 * GET /api/tax/calculate?state=CA&premium=10000&type=stamping
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const state = searchParams.get("state");
    const premium = parseFloat(searchParams.get("premium") || "0");
    const type = searchParams.get("type") || "premium"; // default = premium

    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    if (!premium || premium <= 0) {
      return NextResponse.json(
        { error: "Premium amount must be greater than 0" },
        { status: 400 }
      );
    }

    let result;

    const filingFee = getStampingFeePerFiling(state);
    const slaServiceCharge = getSLAServiceCharge(state);
    const slasFeeCalc = calculateSlasTransactionFee(premium, state);

    if (type === "stamping") {
      result = calculateStampingFee(premium, state);
    } else if (type === "firemarshal") {
      result = calculateFireMarshalTax(premium, state);
    } else if (type === "slas") {
      result = slasFeeCalc;
    } else {
      result = calculatePremiumTax(premium, state);
    }

    console.log(
      `[Tax Calculator] Type: ${type}, State: ${state}, Rate: ${result.taxRate}%, Amount: $${result.taxAmount}`
    );

    return NextResponse.json({
      state: state.toUpperCase(),
      stateName: result.stateName,
      premium,
      taxRate: result.taxRate,
      taxAmount: result.taxAmount,
      flatFee: (result as any).flatFee || 0, // ✅ NEW: Flat fee for fire marshal
      totalAmount: (result as any).totalAmount || result.taxAmount, // ✅ NEW: Total amount
      filingFee, // ✅ NEW
      slaServiceCharge,
      slasTransactionFeeRate: slasFeeCalc.taxRate,
      slasTransactionFeeAmount: slasFeeCalc.taxAmount,
      success: true,
    });
  } catch (error: any) {
    console.error("Tax calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate tax", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST version (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { state, premium, type } = body;

    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    const premiumAmount = parseFloat(premium || "0");

    if (!premiumAmount || premiumAmount <= 0) {
      return NextResponse.json(
        { error: "Premium amount must be greater than 0" },
        { status: 400 }
      );
    }

    let result;
    const slasFeeCalc = calculateSlasTransactionFee(premiumAmount, state);

    if (type === "stamping") {
      result = calculateStampingFee(premiumAmount, state);
    } else if (type === "slas") {
      result = slasFeeCalc;
    } else {
      result = calculatePremiumTax(premiumAmount, state);
    }

    return NextResponse.json({
      state: state.toUpperCase(),
      stateName: result.stateName,
      premium: premiumAmount,
      taxRate: result.taxRate,
      taxAmount: result.taxAmount,
      slasTransactionFeeRate: slasFeeCalc.taxRate,
      slasTransactionFeeAmount: slasFeeCalc.taxAmount,
      success: true,
    });
  } catch (error: any) {
    console.error("Tax calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate tax", details: error.message },
      { status: 500 }
    );
  }
}