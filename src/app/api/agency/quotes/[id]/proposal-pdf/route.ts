import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Carrier from "@/models/Carrier";
import { generateProposalHTML } from "@/lib/services/pdf";
import { savePDFToStorage } from "@/lib/services/pdf/storage";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

// Allow up to 60 seconds for PDF generation
export const maxDuration = 60;


function formatDateMMDDYYYY(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function extractLimits(value: string) {
  if (!value) return ["", "", ""];

  const parts = value.split("/").map(v => v.trim());

  return parts.map((v: string) => {
    // Check if it's already a full dollar amount
    if (v.includes("$") || v.length > 5) return v;
    const num = parseFloat(v) * 1000000;
    if (isNaN(num)) return v;
    return "$" + num.toLocaleString('en-US');
  });
}
function formatToUSD(value: any) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }
  const str = String(value).replace(/[$,]/g, "");
  const num = Number(str);
  if (isNaN(num)) return String(value).includes("$") ? String(value) : `$${value}`;
  return `$${num.toLocaleString('en-US')}`;
}

/**
 * GET /api/agency/quotes/[id]/proposal-pdf
 * Generate and download Proposal PDF for a quote
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Ensure models are registered
    await import("@/models/Carrier");
    await import("@/models/Submission");
    await import("@/models/Agency");

    const agencyId = (session.user as any).agencyId;

    // Get quote with populated data
    const quote = await Quote.findById(params.id)
      .populate("submissionId")
      .populate("carrierId", "name email")
      .lean();

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Verify quote belongs to user's agency
    const submission = quote.submissionId as any;
    if (submission.agencyId.toString() !== agencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Get agency
    const agency = await Agency.findById(agencyId).lean();
    if (!agency) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      );
    }

    // Prepare form data
    const formData = submission.payload || {};
    const carrier = quote.carrierId as any;
    const quoteAny = quote as any;
    const quoteLimitsAny = (quote.limits || {}) as any;

    const isBuildersRisk =
      submission.programId === "builders-risk" ||
      (submission.programName && submission.programName.toLowerCase().includes("builder")) ||
      (submission.programId && submission.programId.toLowerCase().includes("builder")) ||
      quoteAny.policyType === "BUILDERS_RISK" ||
      Boolean(quoteLimitsAny.totalInsurableValue || quoteLimitsAny.completedValue || formData.totalInsurableValue);

    const effectiveDateStr = quote.effectiveDate ? formatDateMMDDYYYY(quote.effectiveDate) : ((formData?.effectiveDate || formData?.proposedEffectiveDateFrom || formData?.requestedEffectiveDate) ? formatDateMMDDYYYY(formData.effectiveDate || formData.proposedEffectiveDateFrom || formData.requestedEffectiveDate) : formatDateMMDDYYYY(new Date()));
    const expirationDateStr = quote.expirationDate ? formatDateMMDDYYYY(quote.expirationDate) : (formData?.requestedExpiryDate ? formatDateMMDDYYYY(formData.requestedExpiryDate) : formatDateMMDDYYYY(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)));

    const insuredFullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ") ||
      formData.namedInsured ||
      submission.clientContact?.name ||
      formData.companyName ||
      "";

    // Prepare proposal data
    const proposalData: any = {
      isBuildersRisk,
      insuredName: insuredFullName,
      quoteNumber: quote._id.toString().substring(0, 8).toUpperCase(),
      proposalDate: formatDateMMDDYYYY(new Date()),
      companyName: formData.companyName || submission.clientContact?.name || "Unknown",
      dba: formData.dba,
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      entityType: formData.entityType || "",
      companyFEIN: formData.companyFEIN || submission.clientContact?.EIN || "",
      phone: formData.phone || submission.clientContact?.phone || "",
      email: formData.email || submission.clientContact?.email || "",
      streetAddress: formData.streetAddress || submission.clientContact?.businessAddress?.street || "",
      city: formData.city || submission.clientContact?.businessAddress?.city || "",
      state: formData.state || submission.clientContact?.businessAddress?.state || "",
      zipCode: formData.zipCode || submission.clientContact?.businessAddress?.zip || "",
      agencyName: agency.name,
      agencyEmail: agency.email,
      agencyPhone: agency.phone,
      carrierName: carrier.name,
      carrierReference: quote.carrierReference,
      programName: isBuildersRisk ? "Builders Risk" : ((submission as any).programName || "Advantage Contractor GL"),
      effectiveDate: effectiveDateStr,
      expirationDate: expirationDateStr,
      carrierQuoteUSD: quote.carrierQuoteUSD,
      premiumTaxPercent: quote.premiumTaxPercent,
      premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
      policyFeeUSD: quote.policyFeeUSD || 0,
      brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
      finalAmountUSD: quote.finalAmountUSD,
      limits: quote.limits,
      endorsements: quote.endorsements || [],
      specialNotes: quote.specialNotes,
      occurrenceLimit: extractLimits(quote.limits?.generalLiability || formData?.coverageLimits)[0],
      fireLegalLimit: formatToUSD(quote.limits?.fireLegalLimit || formData?.fireLegalLimit || "100000"),
      medPayLimit: (() => {
        const val = quote.limits?.medicalExpenseLimit || formData?.medicalExpenseLimit || "5000";
        return val === "Not Applicable" ? val : formatToUSD(val);
      })(),
      personalAdvertisingInjuryLimit: extractLimits(quote.limits?.generalLiability || formData?.coverageLimits)[0],
      aggregateLimit: extractLimits(quote.limits?.generalLiability || formData?.coverageLimits)[1],
      productsCompletedOpsLimit: extractLimits(quote.limits?.generalLiability || formData?.coverageLimits)[2],
      deductible: formatToUSD(quote.limits?.deductible || formData?.deductible || formData?.selfInsuredRetention || "2500"),
      selfInsuredRetention: formatToUSD(quote.limits?.deductible || formData?.selfInsuredRetention || formData?.deductible || "2500"),
      grossReceipts: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US'); })(formData.estimatedGrossReceipts || formData.classCodes?.[0]?.grossReceipts || formData.classCode?.[0]?.grossReceipts || "0"),
      subcontractorCosts: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US'); })(formData.estimatedSubcontractingCosts || "0"),
      employeePayroll: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US'); })(formData.totalPayroll || formData.totalPayrollAmount || "0"),
      descriptionOfOperations: formData.carrierApprovedDescription || formData.classCodeWork?.description || formData.descriptionOfOperations || "",
      addExcessLiability: formData.addExcessLiability === true,
      // Pollution & Professional Liability
      addPollutionLiability: formData?.addPollutionLiability === true ||
        String(formData?.addPollutionLiability) === 'true' ||
        Boolean(formData?.pollutionLiabilityLimit) ||
        ((formData?.addProfessionalPollutionLiability === true || String(formData?.addProfessionalPollutionLiability) === 'true') &&
         formData?.professionalOrPollutionType === 'pollution'),
      pollutionLiabilityLimit: formData?.pollutionLiabilityLimit ? formatToUSD(formData.pollutionLiabilityLimit) : undefined,
      addProfessionalLiability: formData?.addProfessionalLiability === true ||
        String(formData?.addProfessionalLiability) === 'true' ||
        Boolean(formData?.professionalLiabilityLimit) ||
        ((formData?.addProfessionalPollutionLiability === true || String(formData?.addProfessionalPollutionLiability) === 'true') &&
         formData?.professionalOrPollutionType === 'professional'),
      professionalLiabilityLimit: formData?.professionalLiabilityLimit ? formatToUSD(formData.professionalLiabilityLimit) : undefined,

      // Builders Risk specific fields
      buildersLimitPerOccurrence: formatToUSD(quoteLimitsAny.buildersRiskLimit || quoteLimitsAny.totalInsurableValue || quoteLimitsAny.completedValue || formData?.totalInsurableValue || "600000"),
      buildersCompletedValue: formatToUSD(quoteLimitsAny.completedValue || quoteLimitsAny.totalInsurableValue || formData?.totalInsurableValue || "600000"),
      buildersTotalInsurableValue: formatToUSD(quoteLimitsAny.totalInsurableValue || quoteLimitsAny.completedValue || formData?.totalInsurableValue || "600000"),
      buildersWaterDamage: formatToUSD(quoteLimitsAny.waterDamageSublimit || quoteLimitsAny.waterDamage || "$100,000"),
      buildersValuation: quoteLimitsAny.valuation || formData?.valuation || "Actual Cash Value (ACV)",
      buildersBusinessIncome: (quoteLimitsAny.businessIncome && quoteLimitsAny.businessIncome !== "0")
        ? formatToUSD(quoteLimitsAny.businessIncome)
        : (formData?.coverageBusinessIncome && formData?.businessIncomeLimit ? formatToUSD(formData.businessIncomeLimit) : "N/A"),
      buildersExistingStructure: quoteLimitsAny.existingStructure || formData?.existingStructure || "Demolished",
      buildersPolicyTerm: `${effectiveDateStr} – ${expirationDateStr}`,
      carrierFeesUSD: quote.policyFeeUSD || quoteAny.carrierFeesUSD || 350,
      stampingFeePercent: quote.stampingFeePercent !== undefined ? quote.stampingFeePercent : 0.18,
      stampingFeeAmountUSD: quote.stampingFeeAmountUSD || (quote.carrierQuoteUSD ? Math.round(Number(quote.carrierQuoteUSD) * 0.0018 * 100) / 100 : 11.43),
      depositPremiumUSD: quoteAny.downPaymentUSD || quoteAny.depositPremiumUSD || (quote.finalAmountUSD ? Math.round(Number(quote.finalAmountUSD) * 0.2 * 100) / 100 : 1310.39),
      installmentAmountUSD: quoteAny.monthlyInstallmentUSD || quoteAny.installmentAmountUSD || (quote.finalAmountUSD ? Math.round(((Number(quote.finalAmountUSD) * 0.8) / 10) * 100) / 100 : 524.15),
    };

    // Generate HTML
    const htmlContent = generateProposalHTML(proposalData);

    // Generate PDF using production service
    const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
    const pdfBuffer = await generatePDFFromHTML({
      html: htmlContent,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    // Save PDF to storage
    const fileName = `proposal-${quote._id.toString()}.pdf`;
    const pdfUrl = await savePDFToStorage(pdfBuffer, fileName);

    // Log activity: Document generated
    await logActivity(
      createActivityLogData(
        "DOCUMENT_GENERATED",
        `Proposal PDF generated for quote`,
        {
          submissionId: submission._id.toString(),
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "agency",
          },
          details: {
            documentType: "PROPOSAL",
            documentUrl: pdfUrl,
          },
        }
      )
    );

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${quote._id.toString()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Proposal PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate proposal PDF" },
      { status: 500 }
    );
  }
}
