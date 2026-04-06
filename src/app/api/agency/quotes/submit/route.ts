import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Insurance Quote Schema (for rater quotes)
const insuranceQuoteSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: String, required: true },
  quoteNumber: { type: String, required: true, unique: true },
  
  // Form Data
  formData: { type: mongoose.Schema.Types.Mixed, required: true },
  
  // Premium Calculation
  calculatedPremium: { type: Number, required: true },
  basePremium: { type: Number },
  adjustments: { type: mongoose.Schema.Types.Mixed },
  
  // Status
  quoteStatus: {
    type: String,
    enum: ["DRAFT", "CALCULATED", "BOUND", "EXPIRED", "DECLINED"],
    default: "CALCULATED",
  },
  
  // Timestamps
  effectiveDate: { type: Date },
  expirationDate: { type: Date },
  quotedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const InsuranceQuote = mongoose.models.InsuranceQuote || mongoose.model("InsuranceQuote", insuranceQuoteSchema);

/**
 * Generate unique quote number
 */
function generateQuoteNumber(): string {
  const prefix = "Q";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * POST /api/agency/quotes/submit
 * Submit quote for calculation and storage
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { programId, formData, calculatedPremium } = await req.json();

    if (!programId || !formData || !calculatedPremium) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique quote number
    let quoteNumber = generateQuoteNumber();
    
    // Ensure uniqueness
    while (await (InsuranceQuote as any).findOne({ quoteNumber })) {
      quoteNumber = generateQuoteNumber();
    }

    // Calculate expiration date (90 days from now)
    const effectiveDate = new Date(formData.effectiveDate);
    const expirationDate = new Date(effectiveDate);
    expirationDate.setDate(expirationDate.getDate() + 90);

    // Create quote
    const quote = await (InsuranceQuote as any).create({
      agencyId: user.agencyId,
      userId: user.id,
      programId,
      quoteNumber,
      formData,
      calculatedPremium,
      basePremium: calculatedPremium,
      quoteStatus: "CALCULATED",
      effectiveDate,
      expirationDate,
      quotedAt: new Date(),
    });

    // Delete draft after successful quote
    try {
      const QuoteDraft = mongoose.models.QuoteDraft;
      if (QuoteDraft) {
        await QuoteDraft.deleteOne({
          userId: user.id,
          programId,
        });
      }
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote._id.toString(),
        quoteNumber: quote.quoteNumber,
        premium: quote.calculatedPremium,
        effectiveDate: quote.effectiveDate,
        expirationDate: quote.expirationDate,
      },
    });
  } catch (error: any) {
    console.error("Quote submit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit quote" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agency/quotes/submit?quoteId=xxx
 * Get quote details
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const searchParams = req.nextUrl.searchParams;
    const quoteId = searchParams.get("quoteId");

    if (!quoteId) {
      return NextResponse.json(
        { error: "Missing quoteId" },
        { status: 400 }
      );
    }

    await connectDB();

    const quote = await (InsuranceQuote as any).findOne({
      _id: quoteId,
      agencyId: user.agencyId,
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      quote: {
        id: quote._id.toString(),
        quoteNumber: quote.quoteNumber,
        programId: quote.programId,
        premium: quote.calculatedPremium,
        status: quote.quoteStatus,
        effectiveDate: quote.effectiveDate,
        expirationDate: quote.expirationDate,
        formData: quote.formData,
        quotedAt: quote.quotedAt,
      },
    });
  } catch (error: any) {
    console.error("Quote fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

