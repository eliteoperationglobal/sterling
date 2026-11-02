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

    // Robust date formatting to prevent timezone shift issues across India and USA
    const formatAuditDate = (dateVal: any): string => {
      if (!dateVal) return "";
    
      if (typeof dateVal === "string") {
        const trimmed = dateVal.trim();
        const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slashMatch) {
          return `${parseInt(slashMatch[1], 10)}/${parseInt(slashMatch[2], 10)}/${slashMatch[3]}`;
        }
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}/${isoMatch[1]}`;
        }
      }
    
      if (dateVal instanceof Date || (typeof dateVal === "object" && dateVal && typeof (dateVal as any).toISOString === "function")) {
        try {
          const iso = (dateVal as any).toISOString();
          const isoMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (isoMatch) {
            return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}/${isoMatch[1]}`;
          }
        } catch {
          // ignore
        }
      }
    
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", { timeZone: "UTC" });
    };
    
    const startVal = audit.auditPeriodStart || (audit as any).auditEffectiveDate;
    const endVal = audit.auditPeriodEnd;
    const startDateStr = formatAuditDate(startVal);
    const endDateStr = formatAuditDate(endVal);
    const effectiveDatesStr = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : (startDateStr || "");

    const appId = audit.auditId ? audit.auditId.replace("AUD-", "") : (audit._id as any).toString().slice(-6);
    const policyNumberStr = audit.policyNumber || "PENDING";
    const carrierStr = audit.carrier || (audit.submissionId as any)?.carrier || (audit.submissionId as any)?.payload?.carrier || "";
    const prog = (audit.program || (audit.submissionId as any)?.programName || (audit.submissionId as any)?.industry || "").trim().toLowerCase();
    const isConstruction = prog === "construction" || prog === "advantage contractor gl";
    const policyTypeStr = isConstruction ? (audit.policyType || "General Liability") : (audit.policyType || "");

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
            margin: 10mm 15mm 10mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          html, body {
            background: #ffffff;
            color: #0f172a;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            line-height: 1.45;
            height: 100%;
          }
          .invoice-container {
            width: 100%;
            min-height: 900px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .invoice-body {
            flex: 1;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 22px;
          }
          .header-left {
            text-align: left;
          }
          .insured-name {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 3px;
          }
          .meta-line {
            font-size: 13px;
            font-weight: 500;
            color: #334155;
            line-height: 1.45;
          }
          .header-right {
            text-align: right;
            font-size: 13px;
            font-weight: 500;
            color: #334155;
            line-height: 1.45;
          }
          .agency-name-bold {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.3;
          }

          /* SECTION 1: REVENUE & EXPOSURE AUDIT */
          .section-exposure {
            margin-bottom: 20px;
          }
          .section-heading {
            font-size: 15.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }
          .section-subheading {
            font-size: 12.5px;
            font-weight: 500;
            color: #475569;
            margin-bottom: 8px;
          }
          .exposure-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0 18px;
          }
          .exposure-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }
          .exposure-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .exposure-title {
            font-size: 13.5px;
            font-weight: 700;
            color: #0f172a;
          }
          .exposure-desc {
            font-size: 11.5px;
            font-weight: 500;
            color: #64748b;
            margin-top: 1px;
          }
          .exposure-value {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
            font-feature-settings: 'tnum';
          }

          /* SECTION 2: ADDITIONAL AUDIT CHARGES */
          .charges-section {
            margin-bottom: 16px;
          }
          .charges-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 5px;
            margin-bottom: 6px;
          }
          .charges-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
          }
          .charges-value {
            font-weight: 700;
            font-size: 13.5px;
            color: #0f172a;
            text-align: right;
            font-feature-settings: 'tnum';
          }

          /* TOTAL DUE BOX */
          .total-box {
            background: #f1f5f9;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 13px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 14px;
          }
          .total-label {
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }
          .total-amount {
            font-size: 21px;
            font-weight: 900;
            color: #0f172a;
            font-feature-settings: 'tnum';
          }
          .sterling-footer {
            text-align: center;
            margin-top: auto;
            padding-top: 24px;
            padding-bottom: 4px;
            font-size: 12.5px;
            color: #334155;
            line-height: 1.45;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sterling-footer-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-body">
            <!-- HEADER -->
            <div class="header">
              <div class="header-left">
                <div class="insured-name">${audit.namedInsured || "Insured"}</div>
                ${clientContactLine ? `<div class="meta-line">${clientContactLine}</div>` : ""}
                ${policyNumberStr ? `<div class="meta-line">Policy #: ${policyNumberStr}</div>` : ""}
                ${policyTypeStr ? `<div class="meta-line">Policy Type: ${policyTypeStr}</div>` : ""}
                ${carrierStr ? `<div class="meta-line">Carrier: ${carrierStr}</div>` : ""}
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
              <div class="charges-row">
                <span>Premium Audit Administration Fees</span>
                <span class="charges-value">${formatCurrency(carrierFee)}</span>
              </div>

              <!-- TOTAL BOX -->
              <div class="total-box">
                <span class="total-label">TOTAL ADDITIONAL PREMIUM DUE*</span>
                <span class="total-amount">${formatCurrency(additionalPremiumDue)}</span>
              </div>
            </div>
          </div>

          <!-- FOOTER: STERLING INSURANCE SERVICES INFO AT BOTTOM CENTER 
          <div class="sterling-footer">
            <div class="sterling-footer-title">Sterling Insurance Services</div>
            <div>5455 Wilshire Blvd. #1816,</div>
            <div>Los Angeles, CA 90036</div>
            <div>(310) 492-2007</div>
            <div>info@SterlingInsurancePartners.com</div>
            <div>License Number: 6015632</div>
          </div> -->
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
