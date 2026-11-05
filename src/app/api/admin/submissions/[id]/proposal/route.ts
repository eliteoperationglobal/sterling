import { formatPolicyDateRange, formatCalendarDate } from "@/lib/utils/dateUtils";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote, { IPopulatedQuote } from "@/models/Quote";
import PDFCache from "@/models/PDFCache";
import crypto from "crypto";
import { generateProposalHTML } from "@/lib/services/pdf/ProposalPDFHTML";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { generateApartmentProposalHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { generateContractorsProposalHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";

export type ProposalData = {
  quoteNumber: string;
  proposalDate: string;
  desiredCoverageDates: string;

  companyName: string;
  dba?: string;
  firstName: string;
  lastName: string;
  entityType: string;
  companyFEIN: string;
  phone: string;
  email: string;

  agentName: string;

  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  agencyAddress: string;
  agencyState: string;
  agencyZip: string;
  agencyCity: string;

  classCode: string;

  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  grossReceipts: string;

  carrierName: string;
  carrierNameXL?: string;

  programName: string;
  effectiveDate: string;
  expirationDate: string;
  occurrenceLimit?: string;
  productsCompletedOpsLimit?: string;
  personalAdvertisingInjuryLimit?: string;
  fireLegalLimit?: string;
  medPayLimit?: string;
  aggregateLimit?: string;
  deductible?: string;
  selfInsuredRetention?: string;

  carrierQuoteUSD: number;
  premiumTaxPercent: number;
  premiumTaxAmountUSD: number;
  addExcessLiability?: boolean;
  excessLiabilityAmount?: number;
  excessLiabilityLimit?: string;
  addPollutionLiability?: boolean;
  pollutionLiabilityLimit?: string;
  addProfessionalLiability?: boolean;
  professionalLiabilityLimit?: string;
  isExcessOnlyProposal?: boolean;
  policyFeeUSD: number;
  brokerFeeAmountUSD: number;
  finalAmountUSD: number;

  limits?: any;
  endorsements?: any[];
  specialNotes?: string;
  subcontractorCosts: string;
  employeePayroll: string;
  descriptionOfOperations: string;

  // Builders Risk Specific
  isBuildersRisk?: boolean;
  insuredName?: string;
  buildersLimitPerOccurrence?: string;
  buildersCompletedValue?: string;
  buildersTotalInsurableValue?: string;
  buildersWaterDamage?: string;
  buildersValuation?: string;
  buildersBusinessIncome?: string;
  buildersExistingStructure?: string;
  buildersPolicyTerm?: string;
  carrierFeesUSD?: number;
  stampingFeePercent?: number;
  stampingFeeAmountUSD?: number;
  depositPremiumUSD?: number;
  installmentAmountUSD?: number;
  customDocuments?: string[];
};

function formatDateMMDDYYYY(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function getPolicyDateRange(dateInput: any, expInput?: any) {
  if (!dateInput) return "TBD";
  if (typeof dateInput === "string" && dateInput.includes(" - ") && !expInput) {
    return dateInput;
  }
  return formatPolicyDateRange(dateInput, expInput || null);
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

function formatLimit(val: any, fallback: string): string {
  if (val === undefined || val === null || val === "") return fallback;
  if (val === 0 || val === "0") return "$0";
  if (typeof val === "string" && val.includes("$")) return val;
  const num = typeof val === "string" ? parseFloat(val.replace(/,/g, '')) : val;
  if (!isNaN(num)) return `$${num.toLocaleString('en-US')}`;
  return String(val) || fallback;
}

/**
 * GET /api/admin/submissions/[id]/proposal
 * Generate and download proposal PDF (Admin version)
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
    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quoteId");
    const policyTypeParams = url.searchParams.get("policyType");
    if (user.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const submissionId = params.id;

    await connectDB();

    // Get submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Parallel fetch agency and quotes
    const [agencyDoc, quote, xsQuote] = await Promise.all([
      Agency.findById(submission.agencyId),
      quoteId ? Quote.findById(quoteId).populate("carrierId", "name") : Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, 'GENERAL_LIABILITY'] } }).sort({ createdAt: -1 }).populate("carrierId", "name"),
      Quote.findOne({ submissionId: submission._id, policyType: 'EXCESS_LIABILITY' })
    ]);

    const agency = agencyDoc || {
      name: "Unknown Agency",
      email: "",
      phone: "",
      address: { street: "", city: "", state: "", zip: "" }
    };

    // Prepare form data
    const formData = submission.payload || {};

    // Prepare proposal data (copied logic from agency API)
    const allExcessQuotesForSubmission = await Quote.find({ submissionId: submission._id, policyType: "EXCESS_LIABILITY" }).populate("carrierId", "name").lean();
    const uniqueExcessCarrierNames = Array.from(new Set(allExcessQuotesForSubmission.map((q: any) => q.carrierId?.name).filter(Boolean))) as string[];
    const allExcessCarriersStr = uniqueExcessCarrierNames.join(" & ");

    const populatedQuote = quote as unknown as IPopulatedQuote | null;
    let carrierName = populatedQuote?.carrierId?.name || "Unknown Carrier";
    let quoteNumber = populatedQuote ? String(populatedQuote._id).substring(0, 8).toUpperCase() : "TBD";
    let programName = (submission as any).programName || "Advantage Contractor GL";
    let carrierQuoteUSD = quote?.carrierQuoteUSD || 0;
    let premiumTaxPercent = quote?.premiumTaxPercent || 0;
    let premiumTaxAmountUSD = quote?.premiumTaxAmountUSD || 0;
    let policyFeeUSD = quote?.policyFeeUSD || 0;
    let brokerFeeAmountUSD = quote?.brokerFeeAmountUSD || 0;
    let finalAmountUSD = quote?.finalAmountUSD || 0;
    let effectiveDate = quote?.effectiveDate || formData?.effectiveDate || formData?.proposedEffectiveDateFrom || submission.effectiveDate || new Date();
    let expirationDate = quote?.expirationDate || formData?.expirationDate || formData?.proposedEffectiveDateTo || submission.expirationDate || null;
    let limits = quote?.limits || {};
    let endorsements = quote?.endorsements || [];
    let specialNotes = quote?.specialNotes || "";

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);

    // get class codes
    const classCodes = Object.keys(formData.classCodeWork || {});

    const isBuildersRisk =
      submission.programId === "builders-risk" ||
      submission.payload?.programId === "builders-risk" ||
      submission.programName === "Builders Risk" ||
      (submission.programName || "").toLowerCase().includes("builder") ||
      submission.payload?.programName === "Builders Risk" ||
      (submission.payload?.programName || "").toLowerCase().includes("builder") ||
      policyTypeParams === "BUILDERS_RISK" ||
      policyTypeParams === "Builders Risk" ||
      (quote?.policyType as any) === "BUILDERS_RISK" ||
      url.searchParams.get("policyType") === "BUILDERS_RISK" ||
      url.searchParams.get("policyType") === "Builders Risk" ||
      Boolean((quote?.limits as any)?.completedValue || (quote?.limits as any)?.totalInsurableValue || (quote?.limits as any)?.waterDamageSublimit);

    const formatValuation = (val: any): string => {
      if (!val) return "Actual Cash Value (ACV)";
      const s = String(val).trim();
      if (s.toLowerCase() === "acv" || s.toLowerCase() === "actual cash value") return "Actual Cash Value (ACV)";
      if (s.toLowerCase() === "rc" || s.toLowerCase() === "replacement cost") return "Replacement Cost";
      return s;
    };

    const formatExistingStructure = (limitsObj: any, form: any): string => {
      if (limitsObj?.existingStructure) return String(limitsObj.existingStructure);
      if (form?.demoExistingStructure === true || form?.demoExistingStructure === "true") return "Demolished";
      if (form?.coverageExistingStructure === true || form?.coverageExistingStructure === "true") return "Included";
      if (form?.existingStructureValue) return formatToUSD(form.existingStructureValue);
      return "Demolished";
    };

    const formatBusinessIncome = (limitsObj: any, form: any): string => {
      const bi = limitsObj?.softCostsSublimit || limitsObj?.delayInCompletionSublimit || form?.businessIncome;
      if (!bi || bi === "0" || bi === "$0" || bi === "None" || bi === "N/A") return "N/A";
      return formatToUSD(bi);
    };

    const formatWaterDamage = (limitsObj: any, form: any): string => {
      const wd = limitsObj?.waterDamageSublimit || limitsObj?.waterDamage || form?.waterDamageSublimit || form?.waterDamage;
      if (!wd) return "$100,000";
      return formatToUSD(wd);
    };

    const proposalData: ProposalData = {
      subcontractorCosts: formatToUSD(formData.estimatedSubcontractingCosts || "0"),
      quoteNumber,
      proposalDate: formatDateMMDDYYYY(new Date()),
      desiredCoverageDates: getPolicyDateRange(effectiveDate, expirationDate),
      companyName: formData.companyName || submission.clientContact?.name || "Unknown",
      dba: formData.dba,
      firstName: formData.firstName || "",
      agentName: formData.agentName || "Unknown Agent",
      lastName: formData.lastName || "",
      entityType: formData.entityType || "",
      companyFEIN: formData.companyFEIN || submission.clientContact?.EIN || "",
      phone: formData.phone || submission.clientContact?.phone || "",
      email: formData.email || submission.clientContact?.email || "",
      streetAddress: formData.streetAddress || submission.clientContact?.businessAddress?.street || "",
      city: formData.city || submission.clientContact?.businessAddress?.city || "",
      state: formData.state || submission.clientContact?.businessAddress?.state || "",
      zipCode: formData.zipCode || submission.clientContact?.businessAddress?.zip || "",
      grossReceipts: formatToUSD(
        formData.estimatedGrossReceipts ||
        formData.classCodes?.[0]?.grossReceipts ||
        formData.classCode?.[0]?.grossReceipts ||
        "0"
      ),
      agencyName: agency?.name || "Unknown Agency",
      agencyEmail: agency?.email || "",
      agencyPhone: agency?.phone || "",
      agencyAddress: agency?.address?.street || "",
      agencyState: agency?.address?.state || "",
      agencyZip: agency?.address?.zip || "",
      agencyCity: agency?.address?.city || "",
      classCode: classCodes.length > 0 ? classCodes.join(", ") : (formData.classCode || ""),
      carrierName,
      programName: isBuildersRisk ? "Builders Risk" : programName,
      effectiveDate: getPolicyDateRange(effectiveDate, expirationDate),
      expirationDate: formatCalendarDate(expirationDate) || (expirationDate ? formatDateMMDDYYYY(expirationDate) : ""),
      carrierQuoteUSD,
      premiumTaxPercent,
      premiumTaxAmountUSD,
      policyFeeUSD,
      brokerFeeAmountUSD,
      finalAmountUSD,
      limits,
      endorsements,
      specialNotes,
      occurrenceLimit: occurrence,
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData?.fireLegalLimit || "100000"),
      medPayLimit: (() => {
        const val = limits?.medicalExpenseLimit || formData?.medicalExpenseLimit || "5000";
        return val === "Not Applicable" ? val : formatToUSD(val);
      })(),
      personalAdvertisingInjuryLimit: occurrence,
      aggregateLimit: aggregate,
      productsCompletedOpsLimit: products,
      deductible: formatToUSD(limits?.deductible || formData?.deductible || formData?.selfInsuredRetention || "2500"),
      selfInsuredRetention: formatToUSD(limits?.deductible || formData?.selfInsuredRetention || formData?.deductible || "2500"),
      employeePayroll: formatToUSD(formData.totalPayroll || formData.totalPayrollAmount || "$0"),
      descriptionOfOperations:
        formData.carrierApprovedDescription ||
        (formData.classCodeWork ? Object.values(formData.classCodeWork).map((item: any) => item.description).join(", ") : "") ||
        "",
      // Excess Liability
      addExcessLiability: formData.addExcessLiability === true,
      isExcessOnlyProposal: url.searchParams.get("isExcessOnly") === "true",
      carrierNameXL: url.searchParams.get("isExcessOnly") === "true" ? (allExcessCarriersStr || undefined) : undefined,
      excessLiabilityAmount: xsQuote?.finalAmountUSD ?? undefined,
      excessLiabilityLimit: (xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit) ? extractLimits(xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit)[0] : undefined,
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
      // Builders Risk Specific
      isBuildersRisk,
      insuredName: formData.insuredName || formData.companyName || formData.applicantName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || submission.clientContact?.name || "Haron Haiavy",
      buildersLimitPerOccurrence: formatLimit(limits?.limitPerOccurrence || limits?.totalInsurableValue || formData?.totalInsurableValue || formData?.insurableValueTotal, "$600,000"),
      buildersCompletedValue: formatLimit(limits?.completedValue || limits?.totalInsurableValue || formData?.completedValue || formData?.buildingMaterialsValue || formData?.totalInsurableValue || formData?.insurableValueTotal, "$600,000"),
      buildersTotalInsurableValue: formatLimit(limits?.totalInsurableValue || formData?.totalInsurableValue || formData?.insurableValueTotal, "$600,000"),
      buildersWaterDamage: formatWaterDamage(limits, formData),
      buildersValuation: formatValuation(limits?.valuation || formData?.valuation),
      buildersBusinessIncome: formatBusinessIncome(limits, formData),
      buildersExistingStructure: formatExistingStructure(limits, formData),
      buildersPolicyTerm: getPolicyDateRange(effectiveDate, expirationDate),
      carrierFeesUSD: quote?.carrierFeesUSD != null ? quote.carrierFeesUSD : (quote?.policyFeeUSD != null ? quote.policyFeeUSD : 350),
      stampingFeePercent: quote?.stampingFeePercent ?? 0.18,
      stampingFeeAmountUSD: quote?.stampingFeeAmountUSD != null ? quote.stampingFeeAmountUSD : (quote?.carrierQuoteUSD ? Number((quote.carrierQuoteUSD * 0.0018).toFixed(2)) : 11.43),
      depositPremiumUSD: (quote as any)?.depositPremiumUSD ?? (quote as any)?.premiumFinanceTerms?.totalDownpayAmount ?? undefined,
      installmentAmountUSD: (quote as any)?.installmentAmountUSD ?? (quote as any)?.premiumFinanceTerms?.paymentAmount ?? undefined,
      customDocuments: Array.isArray(quote?.customDocuments)
        ? (quote.customDocuments as string[]).filter((d: any) => typeof d === 'string' && d.trim() !== '')
        : [],
    };

    const isApartment = submission.programId === "apartment-buildings" || 
                        submission.programName?.toLowerCase().includes("apartment building");

    const isCommercialProperty = submission.programId === "commercial-property" || 
                                 submission.programName?.toLowerCase().includes("commercial property") ||
                                 (isApartment && quote?.policyType === 'GENERAL_LIABILITY');

    const useApartmentTemplate = isApartment && !isCommercialProperty;

    const isContractors = submission.programId === "contractors-equipment" || 
                         submission.programId === "inland-marine" ||
                         submission.payload?.programId === "contractors-equipment" ||
                         submission.payload?.programId === "inland-marine" ||
                         submission.programName?.toLowerCase().includes("contractors equipment") ||
                         submission.programName?.toLowerCase().includes("inland marine") ||
                         submission.programName?.toLowerCase().includes("construction equipment") ||
                         submission.programName?.toLowerCase().includes("equipment");

    const templateType = useApartmentTemplate ? "apartment" : isCommercialProperty ? "commercial" : isContractors ? "contractors" : isBuildersRisk ? "builders-risk-v14" : "standard";

    // 🚀 CACHE CHECK: Hash the proposalData JSON for stability
    const isRefresh = req.nextUrl.searchParams.get("refresh") === "true" || req.nextUrl.searchParams.get("nocache") === "true";
    const dataHash = crypto.createHash("md5").update(JSON.stringify(proposalData) + templateType).digest("hex");

    if (!isRefresh) {
      try {
        const cachedPdf = await PDFCache.findOne({ hash: dataHash }).lean();
        if (cachedPdf && cachedPdf.pdfBuffer) {
          console.log(`📄 [Admin PDF Download] SERVING FAST CACHE for hash: ${dataHash.substring(0, 8)}...`);
          const policyLabel = isApartment 
            ? (quote?.policyType === 'EXCESS_LIABILITY' ? 'General-Liability' : 'Property')
            : isContractors ? 'Equipment' : isBuildersRisk ? 'Builders-Risk' : 'Proposal';
          const filename = isApartment || isContractors || isBuildersRisk
            ? `${proposalData.companyName}-${policyLabel}-Proposal.pdf`
            : `${proposalData.companyName}-Proposal.pdf`;

          const rawBuf = cachedPdf.pdfBuffer;
          const pdfBuf: Buffer = Buffer.isBuffer(rawBuf)
            ? rawBuf
            : typeof (rawBuf as any)?.value === 'function'
              ? (rawBuf as any).value(true)
              : (rawBuf as any)?.buffer
                ? Buffer.from((rawBuf as any).buffer)
                : Buffer.from(rawBuf as any);

          return new NextResponse(new Uint8Array(pdfBuf), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': pdfBuf.length.toString(),
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
        }
      } catch (cacheFetchErr) {
        console.warn("⚠️ [Admin PDF Download] Cache check failed, falling back to generation:", cacheFetchErr);
      }
    }

    // Generate proposal HTML
    let proposalHTML: string = "";

    if (useApartmentTemplate) {
      console.log("📄 [Admin Proposal Download] Generating Apartment Buildings Proposal...");
      const capitalCoLogoSVG = await loadCapitalCoLogo();
      const apartmentData = mapApartmentDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission,
        capitalCoLogoSVG
      );
      proposalHTML = generateApartmentProposalHTML(apartmentData);
    } else if (isCommercialProperty) {
      console.log("📄 [Admin Proposal Download] Generating Commercial Property Proposal...");
      const { generateCommercialPropertyProposalHTML } = await import('@/lib/services/pdf/CommercialPropertyProposalHTML');
      const q = quote as any;
      const commData = {
        ...proposalData,
        deductible: formatLimit(q?.metadata?.limits?.propertyDeductible ?? q?.limits?.propertyDeductible ?? formData.propertyDeductible ?? formData.deductible, "$1,000"),
        buildingLimit: formatLimit(q?.metadata?.limits?.propertyBuildingLimit ?? q?.limits?.propertyBuildingLimit ?? formData.propertyBuildingLimit, "Included"),
        bppLimit: formatLimit(q?.metadata?.limits?.propertyBppLimit ?? q?.limits?.propertyBppLimit ?? formData.propertyBppLimit, "Included"),
        lossOfIncomeLimit: formatLimit(q?.metadata?.limits?.propertyBusinessIncomeLimit ?? q?.limits?.propertyBusinessIncomeLimit ?? formData.propertyBusinessIncomeLimit, "Included"),
        coinsurance: q?.metadata?.limits?.propertyCoinsurance || q?.limits?.propertyCoinsurance || formData.propertyCoinsurance || formData.subjectsOfInsurance?.[0]?.coinsurance || "80%",
        valuation: formData.propertyValuation || formData.subjectsOfInsurance?.[0]?.valuation || formData.valuation || "Replacement Cost",
        coveredCausesOfLoss: formData.causesOfLoss || formData.subjectsOfInsurance?.[0]?.causesOfLoss || "Special Form",
        constructionType: formData.constructionType || "",
        yearBuilt: formData.yearBuilt || "",
        roofType: formData.roofingType || formData.roofType || "",
        squareFootage: formData.totalBuildingArea || formData.squareFootage || "",
        sprinklered: formData.sprinklered || "No",
        hasGeneralLiability: formData.products?.includes('general-liability') || !!occurrence || !!xsQuote || formData.addGeneralLiability === true || formData.addExcessLiability === true,
      };
      proposalHTML = generateCommercialPropertyProposalHTML(commData as any);
    } else if (isContractors) {
      console.log("📄 [Admin Proposal Download] Generating Contractors Equipment Proposal...");
      const capitalCoLogoSVG = await loadCapitalCoLogo();
      const contractorsData = mapContractorsDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        populatedQuote?.carrierId?.name || "Capital & Co",
        submission,
        capitalCoLogoSVG
      );
      proposalHTML = generateContractorsProposalHTML(contractorsData);
    } else {
      proposalHTML = generateProposalHTML(proposalData);
    }

    // Generate PDF
    const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
    const pdfBuffer = await generatePDFFromHTML({
      html: proposalHTML,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "Generated PDF is empty" }, { status: 500 });
    }

    // Save generated PDF to MongoDB LRU Cache (non-blocking upsert)
    try {
      PDFCache.updateOne(
        { hash: dataHash },
        { $set: { pdfBuffer, createdAt: new Date() } },
        { upsert: true }
      ).catch(e => console.error("⚠️ [Admin PDF Download] Failed to save cache document asynchronously", e));
    } catch (e) {
      // Ignored
    }

    const policyLabel = isApartment 
      ? (quote?.policyType === 'EXCESS_LIABILITY' ? 'General-Liability' : 'Property')
      : isContractors ? 'Equipment' : isBuildersRisk ? 'Builders-Risk' : 'Proposal';
    const filename = isApartment || isContractors || isBuildersRisk
      ? `${proposalData.companyName}-${policyLabel}-Proposal.pdf`
      : `${proposalData.companyName}-Proposal.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("📄 [Admin Proposal Download] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
