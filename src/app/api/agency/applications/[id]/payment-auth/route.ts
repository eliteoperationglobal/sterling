import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
import { loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";

/**
 * GET /api/agency/applications/[id]/payment-auth
 * Generate and download payment authorization PDF
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
    const applicationId = params.id;

    try {
      await connectDB();
    } catch (dbError: any) {
      console.error("MongoDB connection error:", dbError.message);
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 503 }
      );
    }

    // Get application
    const submission = await Submission.findOne({
      _id: applicationId,
      agencyId: user.agencyId,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Get agency details
    let agency: any = null;
    try {
      agency = await Agency.findById(user.agencyId);
    } catch (error: any) {
      console.error("Error fetching agency:", error.message);
      agency = {
        name: "Agency",
        email: "",
        phone: "",
        address: { street: "", city: "", state: "", zip: "" },
      };
    }

    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quoteId");
    const premiumAmount = parseFloat(url.searchParams.get("premiumAmount") || "0");
    const processingFee = parseFloat(url.searchParams.get("processingFee") || "0");
    const totalDue = parseFloat(url.searchParams.get("totalDue") || "0");

    // Get quote if available
    let quote: any = null;
    try {
      if (quoteId) {
        quote = await Quote.findById(quoteId).populate("carrierId", "name");
      } else {
        quote = await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name");
      }
      if (quote) {
        quote = quote.toObject();
      }
    } catch (error: any) {
      console.warn("Error fetching quote (optional):", error.message);
    }

    // Load logo
    const capitalCoLogoSVG = await loadCapitalCoLogo();

    const formData = submission.payload || {};
    const companyName = formData.companyName || formData.applicantName || submission.clientContact?.name || "Customer";
    const agentName = formData.agentName || user.name || "Agent";
    const agencyName = agency?.name || (session?.user as any)?.agencyName || "Agency";
    const carrierName = quote?.carrierId?.name || "Carrier";
    const effectiveDate = formData.effectiveDate || submission.effectiveDate || "";
    const paymentOption = formData.paymentOption || "N/A";

    const fmtUSD = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

    // Generate Payment Authorization HTML
    const paymentAuthHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
        .page { width: 8.5in; min-height: 11in; padding: 0.6in 0.75in; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #9A8B7A; padding-bottom: 20px; }
        .logo-area { max-width: 200px; }
        .logo-area svg { width: 180px; height: auto; }
        .doc-title-area { text-align: right; }
        .doc-title { font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: 0.5px; }
        .doc-subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
        .doc-date { font-size: 11px; color: #64748b; margin-top: 2px; }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .info-box-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-box-value { font-size: 13px; font-weight: 600; color: #1e293b; }

        .amount-section { margin: 30px 0; }
        .amount-table { width: 100%; border-collapse: collapse; }
        .amount-table th { text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; border-bottom: 2px solid #e2e8f0; }
        .amount-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .amount-table .label { color: #475569; font-weight: 500; }
        .amount-table .value { text-align: right; font-weight: 600; color: #1e293b; font-size: 14px; }
        .amount-table tr.total td { border-top: 2px solid #1e293b; border-bottom: none; font-size: 16px; font-weight: 700; padding-top: 16px; }
        .amount-table tr.total .value { color: #9A8B7A; }

        .auth-text { margin: 30px 0; padding: 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 11px; line-height: 1.7; color: #92400e; }

        .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .sig-block { }
        .sig-line { border-top: 1px solid #1e293b; margin-top: 50px; padding-top: 6px; }
        .sig-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }

        @media print {
          .page { padding: 0.5in 0.6in; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-area">
            ${capitalCoLogoSVG || '<div style="font-size:18px;font-weight:bold;color:#9A8B7A;">Capital & Co</div>'}
          </div>
          <div class="doc-title-area">
            <div class="doc-title">Payment Authorization</div>
            <div class="doc-subtitle">Authorization Confirmation</div>
            <div class="doc-date">Date: ${today}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-box-label">Insured / Company</div>
            <div class="info-box-value">${companyName}</div>
          </div>
          <div class="info-box">
            <div class="info-box-label">Carrier</div>
            <div class="info-box-value">${carrierName}</div>
          </div>
          <div class="info-box">
            <div class="info-box-label">Agency</div>
            <div class="info-box-value">${agencyName}</div>
          </div>
          <div class="info-box">
            <div class="info-box-label">Agent</div>
            <div class="info-box-value">${agentName}</div>
          </div>
          <div class="info-box">
            <div class="info-box-label">Payment Option</div>
            <div class="info-box-value">${paymentOption}</div>
          </div>
          <div class="info-box">
            <div class="info-box-label">Effective Date</div>
            <div class="info-box-value">${effectiveDate ? new Date(effectiveDate).toLocaleDateString("en-US", { timeZone: "UTC", month: "2-digit", day: "2-digit", year: "numeric" }) : "TBD"}</div>
          </div>
        </div>

        <div class="amount-section">
          <table class="amount-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="label">Premium Amount</td>
                <td class="value">$${fmtUSD(premiumAmount)}</td>
              </tr>
              <tr>
                <td class="label">3% Processing Fee</td>
                <td class="value">$${fmtUSD(processingFee)}</td>
              </tr>
              <tr class="total">
                <td class="label">Total Amount Due</td>
                <td class="value">$${fmtUSD(totalDue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="auth-text">
          I hereby authorize the payment of the above total amount for the insurance policy described herein.
          I understand that the processing fee is non-refundable and that this authorization confirms my agreement
          to the terms and conditions of the insurance policy.
        </div>

        <div class="signature-section">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">Authorized Signature</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">Date</div>
          </div>
        </div>

        <div class="footer">
          This document was generated on ${today} and serves as a record of payment authorization.
        </div>
      </div>
    </body>
    </html>
    `;

    // Generate PDF
    let pdfBuffer: Buffer;
    try {
      console.log("📄 [Payment Auth PDF] Starting PDF generation...");
      const { generatePDFFromHTML } = await import("@/lib/services/pdf/PDFService");
      pdfBuffer = await generatePDFFromHTML({
        html: paymentAuthHTML,
        format: "A4",
        printBackground: true,
        margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      });
      console.log(`📄 [Payment Auth PDF] PDF generated successfully - Size: ${pdfBuffer.length} bytes`);
    } catch (pdfError: any) {
      console.error("📄 [Payment Auth PDF] PDF generation error:", pdfError);
      return NextResponse.json(
        {
          error: pdfError?.message || "Failed to generate PDF",
          details: process.env.NODE_ENV === "development" ? pdfError?.stack : undefined,
        },
        { status: 500 }
      );
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "Generated PDF is empty" }, { status: 500 });
    }

    const filename = `${companyName}-Payment-Authorization.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("📄 [Payment Auth PDF] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to generate PDF",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
