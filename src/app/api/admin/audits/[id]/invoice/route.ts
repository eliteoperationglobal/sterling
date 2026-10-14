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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const isAdmin = userRole === "system_admin";
    const userAgencyId = (session.user as any).agencyId ? String((session.user as any).agencyId) : null;

    if (!isAdmin && !userAgencyId) {
      return NextResponse.json({ error: "Forbidden: No associated agency found" }, { status: 403 });
    }

    await connectDB();
    await import("@/models/Agency");
    const { id } = params;

    const audit = await Audit.findById(id)
      .populate("agencyId")
      .populate({
        path: "submissionId",
        populate: { path: "agencyId" }
      })
      .lean();
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // 101% Multi-tenant security check:
    if (!isAdmin) {
      const auditAgencyId = (audit.agencyId as any)?._id ? String((audit.agencyId as any)._id) : (audit.agencyId ? String(audit.agencyId) : null);
      const subAgencyId = (audit.submissionId as any)?.agencyId?._id ? String((audit.submissionId as any).agencyId._id) : ((audit.submissionId as any)?.agencyId ? String((audit.submissionId as any).agencyId) : null);

      if (auditAgencyId !== userAgencyId && subAgencyId !== userAgencyId) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this invoice" }, { status: 403 });
      }
    }

    // Mathematical calculations
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val || 0);
    };

    const estExposure = Number(audit.estimatedExposure) || 0;
    const auditedExposure = Number(audit.auditedExposure) || 0;
    const rate = Number(audit.rate) || 0;
    const rateBasis = Number(audit.rateBasis) || 1000;

    const originalPremium = (estExposure / rateBasis) * rate;
    const auditedPremium = (auditedExposure / rateBasis) * rate;
    const premiumDifference = auditedPremium - originalPremium;

    const exposureDiff = auditedExposure - estExposure;
    const pctChange = estExposure > 0 ? ((auditedExposure - estExposure) / estExposure) * 100 : 0;
    const isPositiveExposure = exposureDiff >= 0;
    const varianceAmountStr = `${isPositiveExposure ? '+' : '-'}${formatCurrency(Math.abs(exposureDiff))}`;
    const pctChangeStr = `${isPositiveExposure ? '+' : ''}${pctChange.toFixed(1)}% change`;

    const surplusTaxRate = Number(audit.surplusLinesTaxRate) || 0;
    const stampingFeeRate = Number(audit.stampingFeeRate) || 0;
    const carrierFee = Number(audit.carrierFee) || 0;
    const sterlingFee = Number(audit.sterlingFee) || 0;

    const slTax = premiumDifference * (surplusTaxRate / 100);
    const stampFee = premiumDifference * (stampingFeeRate / 100);

    const additionalPremiumDue = premiumDifference + slTax + stampFee + carrierFee + sterlingFee;

    const payload = (audit.submissionId as any)?.payload || {};
    const clientPhone = audit.clientPhone || payload.applicantPhone || payload.phone || "";
    const clientEmail = audit.clientEmail || payload.applicantEmail || payload.email || "";
    const clientContactParts = [clientPhone, clientEmail].filter(Boolean);
    const clientContactLine = clientContactParts.join(" | ");

    const startDateStr = audit.auditPeriodStart ? new Date(audit.auditPeriodStart).toLocaleDateString("en-US") : "";
    const endDateStr = audit.auditPeriodEnd ? new Date(audit.auditPeriodEnd).toLocaleDateString("en-US") : "";
    const effectiveDatesStr = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : "";

    const appId = audit.auditId ? audit.auditId.replace("AUD-", "") : (audit._id as any).toString().slice(-6);
    const policyNumberStr = audit.policyNumber || "PENDING";

    // Dynamic Agency Details from audit.agencyId or submission.agencyId
    const agency: any = (audit as any).agencyId || ((audit.submissionId as any)?.agencyId) || null;
    const agencyName = agency?.name || "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services";
    const agencyAddress = agency?.address?.street || "5455 Wilshire Blvd. #1816";
    const agencyCity = agency?.address?.city || "Los Angeles";
    const agencyState = agency?.address?.state || "CA";
    const agencyZip = agency?.address?.zip || "90036";
    const agencyCityStateZip = [agencyCity, agencyState].filter(Boolean).join(", ") + (agencyZip ? ` ${agencyZip}` : "");
    const agencyPhone = agency?.phone || "(310) 492-2007";
    const agencyEmail = agency?.email || "CS@capcoinsurance.com";
    const agencyContactParts = [agencyPhone, agencyEmail].filter(Boolean);
    const agencyContactLine = agencyContactParts.join(" | ");

    let agencyNameHTML = `<div class="agency-name-bold">${agencyName}</div>`;
    if (agencyName.includes(" DBA ")) {
      const [legal, dba] = agencyName.split(" DBA ");
      agencyNameHTML = `<div class="agency-name-bold">${legal} DBA</div><div class="agency-name-bold">${dba}</div>`;
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Audit Invoice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          
          @page {
            size: letter portrait;
            margin: 18mm 20mm 18mm 20mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 34px;
          }
          .header-left {
            text-align: left;
          }
          .insured-name {
            font-size: 18.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 6px;
          }
          .meta-line {
            font-size: 13.5px;
            font-weight: 500;
            color: #334155;
            line-height: 1.6;
          }
          .header-right {
            text-align: right;
            font-size: 13.5px;
            font-weight: 500;
            color: #334155;
            line-height: 1.6;
          }
          .agency-name-bold {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.35;
          }

          /* SECTION 1: REVENUE & EXPOSURE AUDIT */
          .section-exposure {
            margin-bottom: 30px;
          }
          .section-heading {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 3px;
          }
          .section-subheading {
            font-size: 13px;
            font-weight: 500;
            color: #475569;
            margin-bottom: 12px;
          }
          .exposure-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 4px 22px;
          }
          .exposure-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 13px 0;
          }
          .exposure-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .exposure-title {
            font-size: 14.5px;
            font-weight: 700;
            color: #0f172a;
          }
          .exposure-desc {
            font-size: 12.5px;
            font-weight: 500;
            color: #64748b;
            margin-top: 2px;
          }
          .exposure-value {
            font-size: 15.5px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
            font-feature-settings: 'tnum';
          }

          /* SECTION 2: ADDITIONAL AUDIT CHARGES */
          .charges-section {
            margin-bottom: 26px;
          }
          .charges-title {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 7px;
            margin-bottom: 10px;
          }
          .charges-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8.5px 0;
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
          }
          .charges-value {
            font-weight: 700;
            font-size: 14.5px;
            color: #0f172a;
            text-align: right;
            font-feature-settings: 'tnum';
          }

          /* TOTAL DUE BOX */
          .total-box {
            background: #f1f5f9;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 18px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 24px;
          }
          .total-label {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }
          .total-amount {
            font-size: 23px;
            font-weight: 900;
            color: #0f172a;
            font-feature-settings: 'tnum';
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <div class="insured-name">${audit.namedInsured || "Insured"}</div>
            ${clientContactLine ? `<div class="meta-line">${clientContactLine}</div>` : ""}
            ${policyNumberStr ? `<div class="meta-line">Policy #: ${policyNumberStr}</div>` : ""}
            ${effectiveDatesStr ? `<div class="meta-line">Policy Effective Dates ${effectiveDatesStr}</div>` : ""}
            <div class="meta-line">App ID: ${appId}</div>
          </div>
          <div class="header-right">
            ${agencyNameHTML}
            ${agencyAddress ? `<div>${agencyAddress}</div>` : ""}
            ${agencyCityStateZip ? `<div>${agencyCityStateZip}</div>` : ""}
            ${agencyContactLine ? `<div>${agencyContactLine}</div>` : ""}
          </div>
        </div>

        <!-- SECTION 1: REVENUE & EXPOSURE AUDIT -->
        <div class="section-exposure">
          <div class="section-heading">REVENUE & EXPOSURE AUDIT</div>
          <div class="section-subheading">Rating basis: per $${rateBasis.toLocaleString()} of revenue</div>
          
          <div class="exposure-box">
            <div class="exposure-row">
              <div>
                <div class="exposure-title">Original Estimated Exposure</div>
                <div class="exposure-desc">Initial policy basis</div>
              </div>
              <div class="exposure-value">${formatCurrency(estExposure)}</div>
            </div>
            <div class="exposure-row">
              <div>
                <div class="exposure-title">Audited Gross Revenue</div>
                <div class="exposure-desc">Verified actual basis</div>
              </div>
              <div class="exposure-value">${formatCurrency(auditedExposure)}</div>
            </div>
            <div class="exposure-row">
              <div>
                <div class="exposure-title">Exposure Variance</div>
                <div class="exposure-desc">${pctChangeStr}</div>
              </div>
              <div class="exposure-value">${varianceAmountStr}</div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: ADDITIONAL AUDIT CHARGES -->
        <div class="charges-section">
          <div class="charges-title">ADDITIONAL AUDIT CHARGES</div>
          
          <div class="charges-row">
            <span>Premium</span>
            <span class="charges-value">${formatCurrency(premiumDifference)}</span>
          </div>
          ${carrierFee > 0 ? `
          <div class="charges-row">
            <span>Carrier Policy Fee</span>
            <span class="charges-value">${formatCurrency(carrierFee)}</span>
          </div>` : ""}
          <div class="charges-row">
            <span>Premium Audit Service Fee</span>
            <span class="charges-value">${formatCurrency(sterlingFee)}</span>
          </div>
          <div class="charges-row">
            <span>Surplus Lines Tax</span>
            <span class="charges-value">${formatCurrency(slTax)}</span>
          </div>
          <div class="charges-row">
            <span>Stamping Fee</span>
            <span class="charges-value">${formatCurrency(stampFee)}</span>
          </div>

          <!-- TOTAL BOX -->
          <div class="total-box">
            <span class="total-label">TOTAL ADDITIONAL PREMIUM DUE*</span>
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
