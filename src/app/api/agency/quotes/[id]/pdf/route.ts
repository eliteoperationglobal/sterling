import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { generateQuotePDF } from "@/lib/services/pdf/QuotePDF";

/**
 * GET /api/agency/quotes/[id]/pdf
 * Generate and download quote PDF
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = params;

    await connectDB();

    // Fetch quote from database
    const InsuranceQuote = mongoose.models.InsuranceQuote;
    if (!InsuranceQuote) {
      return NextResponse.json({ error: "InsuranceQuote model not found" }, { status: 500 });
    }

    const quote = await InsuranceQuote.findOne({
      _id: id,
      agencyId: user.agencyId,
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Prepare endorsements list
    const endorsements: string[] = [];
    if (quote.formData.blanketAdditionalInsured) endorsements.push("Blanket Additional Insured");
    if (quote.formData.blanketWaiverOfSubrogation) endorsements.push("Blanket Waiver of Subrogation");
    if (quote.formData.blanketPrimaryWording) endorsements.push("Blanket Primary & Non-Contributory Wording");
    if (quote.formData.blanketPerProjectAggregate) endorsements.push("Blanket Per Project Aggregate");
    if (quote.formData.blanketCompletedOperations) endorsements.push("Blanket Completed Operations");

    // Prepare quote data for PDF
    const quoteData = {
      quoteNumber: quote.quoteNumber,
      companyName: quote.formData.companyName || "N/A",
      contactName: `${quote.formData.firstName || ""} ${quote.formData.lastName || ""}`.trim() || "N/A",
      email: quote.formData.email || "N/A",
      phone: quote.formData.phone || "N/A",
      address: `${quote.formData.streetAddress || ""}, ${quote.formData.city || ""}, ${quote.formData.state || ""}`.trim() || "N/A",
      programName: quote.programId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      effectiveDate: quote.effectiveDate || new Date(),
      expirationDate: quote.expirationDate || new Date(),
      premium: quote.calculatedPremium || 0,
      coverageLimits: quote.formData.coverageLimits || "N/A",
      deductible: quote.formData.deductible || "N/A",
      grossReceipts: quote.formData.estimatedGrossReceipts || "0",
      selectedStates: quote.formData.selectedStates || [],
      endorsements,
    };

    // Generate PDF HTML
    const pdfHTML = await generateQuotePDF(quoteData);

    // Return HTML that can be printed to PDF by the browser
    return new NextResponse(pdfHTML, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="quote-${quote.quoteNumber}.html"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}








