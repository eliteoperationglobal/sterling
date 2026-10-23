/**
 * Production-ready PDF generation service
 * Uses external service for HTML-to-PDF conversion
 */

import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import FinancePlan from "@/models/FinancePlan";
import { generateProposalHTML } from "./ProposalPDFHTML";
import { generateCommercialPropertyProposalHTML } from "./CommercialPropertyProposalHTML";
import { generateCarrierFormsHTML } from "./CarrierFormsPDFHTML";
import { savePDFToStorage } from "./storage";

interface PDFGenerationOptions {
  html: string;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
}

interface GenerateDocumentOptions {
  quoteId: string;
  documentType: 'PROPOSAL' | 'FINANCE_AGREEMENT' | 'CARRIER_FORM';
}

interface GenerateDocumentResult {
  success: boolean;
  documentUrl?: string;
  documentName?: string;
  error?: string;
}

/**
 * Minify HTML to reduce size for CustomJS
 */
function minifyHTML(html: string): string {
  return html
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Optimize CSS by removing unnecessary whitespace and comments
 */
function optimizeCSS(css: string): string {
  return css
    // Remove CSS comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around colons, semicolons, braces
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Generate PDF using CustomJS only.
 * Requires CUSTOMJS_API_KEY in environment variables.
 */
export async function generatePDFFromHTML(options: PDFGenerationOptions): Promise<Buffer> {
  const { html } = options;

  const CUSTOMJS_API_KEY = process.env.CUSTOMJS_API_KEY;
  const CUSTOMJS_URL = process.env.CUSTOMJS_URL || 'https://e.customjs.io/html2pdf';

  if (!CUSTOMJS_API_KEY) {
    throw new Error(
      'PDF generation requires CUSTOMJS_API_KEY. Set it in your environment variables (e.g. .env.local). Get an API key from https://www.customjs.space/'
    );
  }

  let minifiedHTML: string = html;
  try {
    minifiedHTML = minifyHTML(html);
  } catch (minifyError: any) {
    console.error('[PDF Service] Error minifying HTML, using original:', minifyError.message);
    minifiedHTML = html;
  }

  const htmlSizeKB = Buffer.byteLength(minifiedHTML, 'utf8') / 1024;
  console.log('[PDF Service] Using CustomJS for PDF generation. HTML size:', htmlSizeKB.toFixed(2), 'KB');

  const customJSBody: any = {
    input: {
      html: minifiedHTML,
    },
  };

  const response = await fetch(CUSTOMJS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CUSTOMJS_API_KEY,
    },
    body: JSON.stringify(customJSBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }
    console.error('[PDF Service] CustomJS API error:', response.status, errorText);
    console.error('[PDF Service] CustomJS error data:', errorData);

    if (response.status === 403 && (errorData.message || '').toLowerCase().includes('too many requests')) {
      throw new Error(
        'CustomJS rate limit exceeded (Too Many Requests). Please wait a few minutes before trying again, or upgrade your CustomJS plan for higher limits.'
      );
    }

    if (response.status === 404) {
      const errorMessage = errorData.error || errorData.message || errorText || 'Unknown error';
      throw new Error(
        `CustomJS API endpoint not found (404): ${errorMessage}. ` +
        `Verify CUSTOMJS_API_KEY and that your account has access. Endpoint: ${CUSTOMJS_URL}`
      );
    }

    const errorMessage = errorData.error || errorData.message || errorText || 'Unknown error';
    throw new Error(`CustomJS API error (${response.status}): ${errorMessage}`);
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  console.log('[PDF Service] CustomJS success - PDF generated:', pdfBuffer.length, 'bytes');
  return pdfBuffer;
}

/**
 * Check if PDF service is configured
 */
export function isPDFServiceConfigured(): boolean {
  return !!process.env.CUSTOMJS_API_KEY;
}

/**
 * PDFService - High-level service for generating documents
 */
export const PDFService = {
  /**
   * Generate a document (Proposal, Finance Agreement, or Carrier Forms)
   * Fetches all necessary data and generates the PDF
   */
  async generateDocument(options: GenerateDocumentOptions): Promise<GenerateDocumentResult> {
    const { quoteId, documentType } = options;

    try {
      await connectDB();

      // Ensure models are registered
      await import("@/models/Carrier");
      await import("@/models/Agency");

      // Fetch quote with populated data
      const quote = await Quote.findById(quoteId)
        .populate("submissionId")
        .populate("carrierId", "name email")
        .lean();

      if (!quote) {
        return {
          success: false,
          error: "Quote not found",
        };
      }

      const submission = quote.submissionId as any;
      if (!submission) {
        return {
          success: false,
          error: "Submission not found",
        };
      }

      // Get agency
      const agency = await Agency.findById(submission.agencyId).lean();
      if (!agency) {
        return {
          success: false,
          error: "Agency not found",
        };
      }

      const formData = submission.payload || {};
      const carrier = quote.carrierId as any;

      let htmlContent: string;
      let documentName: string;

      // Generate HTML based on document type
      switch (documentType) {
        case "PROPOSAL": {
          const isCommercialProperty = submission.programName?.toLowerCase().includes("commercial property");
          const coverageLimits = (formData.coverageLimits || formData.generalLiabilityLimit || "").split("/").map((s: string) => s.trim());
          const formatLimit = (val: string) => val.includes("$") ? val : `$${val.replace("M", ",000,000").replace("m", ",000,000")}`;

          const baseData = {
            quoteNumber: quote._id.toString().substring(0, 8).toUpperCase(),
            proposalDate: new Date().toLocaleDateString(),
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
            agencyAddress: agency.address?.street || "",
            agencyCity: agency.address?.city || "",
            agencyState: agency.address?.state || "",
            agencyZip: agency.address?.zip || "",
            agentName: formData.agentName || "",
            carrierName: carrier.name,
            carrierReference: quote.carrierReference,
            programName: submission.programName || "Advantage Contractor GL",
            effectiveDate: quote.effectiveDate ? new Date(quote.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : new Date().toLocaleDateString(),
            expirationDate: quote.expirationDate ? new Date(quote.expirationDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            carrierQuoteUSD: quote.carrierQuoteUSD,
            premiumTaxPercent: quote.premiumTaxPercent,
            premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
            policyFeeUSD: quote.policyFeeUSD || 0,
            brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
            finalAmountUSD: quote.finalAmountUSD,
            limits: quote.limits,
            endorsements: quote.endorsements || [],
            specialNotes: quote.specialNotes,
            descriptionOfOperations: formData.carrierApprovedDescription || "",
          };

          const isBuildersRisk =
            (submission as any).programId === "builders-risk" ||
            (submission as any).payload?.programId === "builders-risk" ||
            submission.programName === "Builders Risk" ||
            (submission.programName || "").toLowerCase().includes("builder") ||
            (submission as any).payload?.programName === "Builders Risk" ||
            ((submission as any).payload?.programName || "").toLowerCase().includes("builder") ||
            (quote as any)?.policyType === "BUILDERS_RISK" ||
            Boolean((quote as any)?.limits?.completedValue || (quote as any)?.limits?.totalInsurableValue || (quote as any)?.limits?.waterDamageSublimit);

          if (isCommercialProperty) {
            const q = quote as any;
            const proposalData = {
              ...baseData,
              deductible: q?.metadata?.limits?.propertyDeductible || q?.limits?.propertyDeductible || formData.propertyDeductible || formData.deductible || "$1,000",
              buildingLimit: q?.metadata?.limits?.propertyBuildingLimit || q?.limits?.propertyBuildingLimit || formData.propertyBuildingLimit || "Included",
              bppLimit: q?.metadata?.limits?.propertyBppLimit || q?.limits?.propertyBppLimit || formData.propertyBppLimit || "Included",
              lossOfIncomeLimit: q?.metadata?.limits?.propertyBusinessIncomeLimit || q?.limits?.propertyBusinessIncomeLimit || formData.propertyBusinessIncomeLimit || "Included",
              coinsurance: q?.metadata?.limits?.propertyCoinsurance || q?.limits?.propertyCoinsurance || formData.propertyCoinsurance || formData.subjectsOfInsurance?.[0]?.coinsurance || "80%",
              valuation: formData.propertyValuation || formData.subjectsOfInsurance?.[0]?.valuation || formData.valuation || "Replacement Cost",
              coveredCausesOfLoss: formData.causesOfLoss || formData.subjectsOfInsurance?.[0]?.causesOfLoss || "Special Form",
              constructionType: formData.constructionType || "",
              yearBuilt: formData.yearBuilt || "",
              roofType: formData.roofType || "",
              squareFootage: formData.squareFootage || "",
              sprinklered: formData.sprinklered || "No",
            };
            htmlContent = generateCommercialPropertyProposalHTML(proposalData as any);
          } else {
            const proposalData = {
              ...baseData,
              programName: isBuildersRisk ? "Builders Risk" : baseData.programName,
              occurrenceLimit: formatLimit(coverageLimits[0] || "1,000,000"),
              aggregateLimit: formatLimit(coverageLimits[1] || coverageLimits[0] || "2,000,000"),
              productsCompletedOpsLimit: formatLimit(coverageLimits[2] || coverageLimits[0] || "2,000,000"),
              personalAdvertisingInjuryLimit: formatLimit(coverageLimits[0] || "1,000,000"),
              fireLegalLimit: formData.fireLegalLimit || "$50,000",
              medPayLimit: formData.medicalExpenseLimit || "$5,000",
              deductible: formData.deductible || "$2,500",
              selfInsuredRetention: formData.selfInsuredRetention || formData.deductible || "$2,500",
              employeePayroll: formData.totalPayroll
                ? `$${parseInt(String(formData.totalPayroll).replace(/[^0-9]/g, "") || "0").toLocaleString('en-US')}`
                : (formData.totalPayrollAmount ? `$${parseInt(String(formData.totalPayrollAmount).replace(/[^0-9]/g, "") || "0").toLocaleString('en-US')}` : "$0"),
              grossReceipts: formData.estimatedGrossReceipts
                ? `$${parseInt(formData.estimatedGrossReceipts).toLocaleString('en-US')}`
                : "$0",
              subcontractorCosts: formData.estimatedSubcontractingCosts
                ? `$${parseInt(formData.estimatedSubcontractingCosts).toLocaleString('en-US')}`
                : "$0",
              classCode: formData.carrierApprovedDescription || "General Contractor",
              addExcessLiability: formData.addExcessLiability === true,
              addPollutionLiability: formData.addPollutionLiability === true ||
                String(formData.addPollutionLiability) === "true" ||
                Boolean(formData.pollutionLiabilityLimit) ||
                ((formData.addProfessionalPollutionLiability === true || String(formData.addProfessionalPollutionLiability) === "true") &&
                 formData.professionalOrPollutionType === "pollution"),
              pollutionLiabilityLimit: formData.pollutionLiabilityLimit ? (formData.pollutionLiabilityLimit.includes("$") ? formData.pollutionLiabilityLimit : `$${formData.pollutionLiabilityLimit}`) : undefined,
              addProfessionalLiability: formData.addProfessionalLiability === true ||
                String(formData.addProfessionalLiability) === "true" ||
                Boolean(formData.professionalLiabilityLimit) ||
                ((formData.addProfessionalPollutionLiability === true || String(formData.addProfessionalPollutionLiability) === "true") &&
                 formData.professionalOrPollutionType === "professional"),
              professionalLiabilityLimit: formData.professionalLiabilityLimit ? (formData.professionalLiabilityLimit.includes("$") ? formData.professionalLiabilityLimit : `$${formData.professionalLiabilityLimit}`) : undefined,

              // Builders Risk Specific
              isBuildersRisk,
              insuredName: formData.insuredName || formData.companyName || formData.applicantName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || (submission as any).clientContact?.name || "Haron Haiavy",
              buildersLimitPerOccurrence: (quote as any)?.limits?.limitPerOccurrence ? `$${Number(String((quote as any).limits.limitPerOccurrence).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : (formData?.totalInsurableValue ? `$${Number(String(formData.totalInsurableValue).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "$600,000"),
              buildersCompletedValue: (quote as any)?.limits?.completedValue ? `$${Number(String((quote as any).limits.completedValue).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : (formData?.completedValue ? `$${Number(String(formData.completedValue).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "$600,000"),
              buildersTotalInsurableValue: (quote as any)?.limits?.totalInsurableValue ? `$${Number(String((quote as any).limits.totalInsurableValue).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "$600,000",
              buildersWaterDamage: (quote as any)?.limits?.waterDamageSublimit ? `$${Number(String((quote as any).limits.waterDamageSublimit).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "$100,000",
              buildersValuation: ((quote as any)?.limits?.valuation || formData?.valuation || "Actual Cash Value (ACV)").toLowerCase().includes("acv") ? "Actual Cash Value (ACV)" : ((quote as any)?.limits?.valuation || formData?.valuation || "Actual Cash Value (ACV)"),
              buildersBusinessIncome: (quote as any)?.limits?.softCostsSublimit ? `$${Number(String((quote as any).limits.softCostsSublimit).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "N/A",
              buildersExistingStructure: (quote as any)?.limits?.existingStructure || (formData?.demoExistingStructure ? "Demolished" : "Demolished"),
              buildersPolicyTerm: `${baseData.effectiveDate} – ${baseData.expirationDate}`,
              carrierFeesUSD: (quote as any)?.carrierFeesUSD != null ? (quote as any).carrierFeesUSD : ((quote as any)?.policyFeeUSD != null ? (quote as any).policyFeeUSD : 350),
              stampingFeePercent: (quote as any)?.stampingFeePercent ?? 0.18,
              stampingFeeAmountUSD: (quote as any)?.stampingFeeAmountUSD != null ? (quote as any).stampingFeeAmountUSD : ((quote as any)?.carrierQuoteUSD ? Number(((quote as any).carrierQuoteUSD * 0.0018).toFixed(2)) : 11.43),
            };
            htmlContent = generateProposalHTML(proposalData as any);
          }
          documentName = `proposal-${quote._id.toString()}.pdf`;
          break;
        }

        case "FINANCE_AGREEMENT": {
          const financePlan = await FinancePlan.findOne({ quoteId: quote._id }).lean();
          if (!financePlan) {
            return {
              success: false,
              error: "Finance plan not found",
            };
          }

          // For now, use the React PDF version (FinanceAgreementPDF.tsx)
          // TODO: Create HTML version for Finance Agreement
          return {
            success: false,
            error: "Finance Agreement HTML generation not yet implemented. Please use the React PDF version.",
          };
        }

        case "CARRIER_FORM": {
          const carrierFormsData = {
            submissionId: submission._id.toString(),
            formDate: new Date().toLocaleDateString(),
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
            carrierName: carrier.name,
            carrierReference: quote.carrierReference,
            programName: submission.programName || "Advantage Contractor GL",
            applicationData: formData,
          };
          htmlContent = generateCarrierFormsHTML(carrierFormsData);
          documentName = `carrier-forms-${quote._id.toString()}.pdf`;
          break;
        }

        default:
          return {
            success: false,
            error: `Unknown document type: ${documentType}`,
          };
      }

      // Generate PDF from HTML
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
      const documentUrl = await savePDFToStorage(pdfBuffer, documentName);

      return {
        success: true,
        documentUrl,
        documentName,
      };
    } catch (error: any) {
      console.error("[PDFService] generateDocument error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate document",
      };
    }
  },
};