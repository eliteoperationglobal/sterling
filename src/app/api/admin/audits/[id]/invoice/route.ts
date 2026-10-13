import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const audit = await Audit.findById(id).populate("submissionId").lean();
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Mathematical calculations
    const estExposure = Number(audit.estimatedExposure) || 0;
    const auditedExposure = Number(audit.auditedExposure) || 0;
    const rate = Number(audit.rate) || 0;
    const rateBasis = Number(audit.rateBasis) || 1000;

    const originalPremium = (estExposure / rateBasis) * rate;
    const auditedPremium = (auditedExposure / rateBasis) * rate;
    const premiumDifference = auditedPremium - originalPremium;

    const surplusTaxRate = Number(audit.surplusLinesTaxRate) || 0;
    const stampingFeeRate = Number(audit.stampingFeeRate) || 0;
    const carrierFee = Number(audit.carrierFee) || 0;
    const sterlingFee = Number(audit.sterlingFee) || 0;

    const slTax = premiumDifference * (surplusTaxRate / 100);
    const stampFee = premiumDifference * (stampingFeeRate / 100);

    const additionalPremiumDue = premiumDifference + slTax + stampFee + carrierFee + sterlingFee;

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val || 0);
    };

    const payload = (audit.submissionId as any)?.payload || {};
    const applicantAddress = payload.applicantAddress || payload.address || "";
    const applicantCity = payload.applicantCity || payload.city || "";
    const applicantState = payload.applicantState || payload.state || "";
    const applicantZip = payload.applicantZip || payload.zip || "";
    const cityStateZip = [applicantCity, applicantState].filter(Boolean).join(", ") + (applicantZip ? ` ${applicantZip}` : "");
    const clientPhone = audit.clientPhone || payload.applicantPhone || payload.phone || "";
    const clientEmail = audit.clientEmail || payload.applicantEmail || payload.email || "";
    const appId = audit.auditId ? audit.auditId.replace("AUD-", "") : (audit._id as any).toString().slice(-6);
    const invoiceDate = new Date((audit as any).auditEffectiveDate || (audit as any).auditPeriodStart || (audit as any).createdAt).toLocaleDateString("en-US");
    const policyNumberStr = audit.policyNumber || "";

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Audit Invoice</title>
        <style>
          @page {
            size: letter portrait;
            margin: 20mm 20mm 20mm 20mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.45;
            padding: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
          }
          .header-left {
            text-align: left;
            font-size: 13.5px;
            line-height: 1.45;
          }
          .header-right {
            text-align: right;
            font-size: 13.5px;
            line-height: 1.45;
          }
          .bold {
            font-weight: bold;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #000000;
            padding-bottom: 5px;
            margin-bottom: 12px;
          }
          .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 13.5px;
          }
          .calc-row-semi {
            font-weight: 600;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            gap: 40px;
            padding-top: 14px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
          }
          .total-amount {
            min-width: 110px;
            text-align: right;
            font-weight: 800;
            font-size: 14.5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div>${audit.namedInsured || "Insured"}</div>
            ${applicantAddress ? `<div>${applicantAddress}</div>` : ""}
            ${cityStateZip ? `<div>${cityStateZip}</div>` : ""}
            ${clientPhone ? `<div>${clientPhone}</div>` : ""}
            ${clientEmail ? `<div>Email: ${clientEmail}</div>` : ""}
            ${policyNumberStr ? `<div>Policy #: ${policyNumberStr}</div>` : ""}
            <div>Date: ${invoiceDate}</div>
            <div>App ID: ${appId}</div>
          </div>
          <div class="header-right">
            <div class="bold">Gamaty Insurance Agency LLC DBA</div>
            <div class="bold">Capital & Co Insurance Services</div>
            <div>5455 Wilshire Blvd. #1816</div>
            <div>Los Angeles, CA 90036</div>
            <div>(310) 492-2007</div>
            <div>CS@capcoinsurance.com</div>
          </div>
        </div>

        <div style="margin-top: 24px;">
          <div class="section-title">AUDIT PREMIUM CALCULATION*</div>
          
          <div class="calc-row">
            <span>Audited Premium</span>
            <span>${formatCurrency(auditedPremium)}</span>
          </div>
          <div class="calc-row">
            <span>Original (Deposit) Premium</span>
            <span>${formatCurrency(originalPremium)}</span>
          </div>
          <div class="calc-row calc-row-semi">
            <span>Premium Difference</span>
            <span>${formatCurrency(premiumDifference)}</span>
          </div>
          <div class="calc-row">
            <span>Carrier Policy Fee</span>
            <span>${formatCurrency(carrierFee)}</span>
          </div>
          <div class="calc-row">
            <span>Premium Audit Service Fee</span>
            <span>${formatCurrency(sterlingFee)}</span>
          </div>
          <div class="calc-row">
            <span>Surplus Lines Tax</span>
            <span>${formatCurrency(slTax)}</span>
          </div>
          <div class="calc-row">
            <span>Stamping Fee</span>
            <span>${formatCurrency(stampFee)}</span>
          </div>

          <div class="total-row">
            <span>TOTAL ADDITIONAL PREMIUM DUE*</span>
            <span class="total-amount">${formatCurrency(additionalPremiumDue)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using production CustomJS service
    const { generatePDFFromHTML } = await import("@/lib/services/pdf/PDFService");
    const pdfBuffer = await generatePDFFromHTML({
      html: invoiceHTML,
      format: "Letter",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "Generated PDF is empty" }, { status: 500 });
    }

    const safeName = (audit.namedInsured || "Audit").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeName}-${audit.auditId || "Invoice"}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("📄 [Audit Invoice Download Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate audit invoice PDF" },
      { status: 500 }
    );
  }
}
