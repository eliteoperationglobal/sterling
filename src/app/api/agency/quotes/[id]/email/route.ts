import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { sendQuoteEmail } from "@/lib/services/email/EmailService";

/**
 * POST /api/agency/quotes/[id]/email
 * Send quote email to client
 */
export async function POST(
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
    const body = await req.json();
    const { recipientEmail } = body;

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

    // Prepare email data
    const emailData = {
      recipientName: `${quote.formData.firstName || ""} ${quote.formData.lastName || ""}`.trim() || "Valued Customer",
      recipientEmail: recipientEmail || quote.formData.email,
      companyName: quote.formData.companyName || "Your Company",
      quoteNumber: quote.quoteNumber,
      premium: quote.calculatedPremium,
      effectiveDate: quote.effectiveDate,
      expirationDate: quote.expirationDate,
      programName: quote.programId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      coverageLimits: quote.formData.coverageLimits || "N/A",
      quotePDFUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agency/quotes/${id}/pdf`,
    };

    // Send email
    const emailSent = await sendQuoteEmail(emailData);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log email sent (you might want to store this in database)
    console.log(`📧 Quote ${quote.quoteNumber} emailed to ${emailData.recipientEmail}`);

    return NextResponse.json({
      success: true,
      message: "Quote email sent successfully",
      sentTo: emailData.recipientEmail,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}








