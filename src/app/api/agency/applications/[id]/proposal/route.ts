import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote, { IPopulatedQuote } from "@/models/Quote";
import PDFCache from "@/models/PDFCache";
import * as crypto from "crypto";
import { generateProposalHTML } from "@/lib/services/pdf/ProposalPDFHTML";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { generateApartmentProposalHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { generateContractorsProposalHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";



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
};

function formatDateMMDDYYYY(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function extractLimits(value: string) {
  if (!value) return ["", "", ""];

  const parts = value.split("/").map(v => v.trim());

  return parts.map((v: string) => {
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

function getPolicyDateRange(dateInput: string | Date) {
  let start = new Date(dateInput);

  // If it's an invalid date string, attempt to parse manually (e.g. DD/MM/YYYY)
  if (isNaN(start.getTime()) && typeof dateInput === "string") {
    const parts = dateInput.split(/[-/.]/);
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (p0 > 12) { // DD/MM/YYYY format
        start = new Date(p2, p1 - 1, p0);
      } else { // MM/DD/YYYY format
        start = new Date(p2, p0 - 1, p1);
      }
    }
  }

  if (isNaN(start.getTime())) {
    start = new Date();
  }

  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);

  const format = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

  return `${format(start)} – ${format(end)}`;
}
/**
 * GET /api/agency/applications/[id]/proposal
 * Generate and download proposal PDF
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

    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quoteId");
    const policyTypeParams = url.searchParams.get("policyType");

    // 🚀 PARALLEL: Fetch agency + GL quote + XS quote simultaneously
    const defaultAgency = {
      name: "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services",
      email: "eidan@capcoinsurance.com",
      phone: "(310) 284-2136",
      address: { street: "292 S La Cienega Blvd Ste 206", city: "Beverly Hills", state: "CA", zip: "90211" },
    };

    let agency: any;
    let quote: any = null;
    let xsQuote: any = null;

    try {
      const agencyPromise = Agency.findById(user.agencyId).lean();
      let baseQuote = null;
      if (quoteId) {
        baseQuote = await Quote.findById(quoteId).populate("carrierId", "name").lean();
      }

      if (baseQuote) {
        if (baseQuote.policyType === "EXCESS_LIABILITY") {
          xsQuote = baseQuote;
          // Prefer GL from same carrier, then fallback to any GL
          const [glMatch, glAny] = await Promise.all([
            Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, "GENERAL_LIABILITY"] }, carrierId: baseQuote.carrierId }).populate("carrierId", "name").lean(),
            Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, "GENERAL_LIABILITY"] } }).populate("carrierId", "name").lean(),
          ]);
          quote = glMatch || glAny;
        } else {
          quote = baseQuote;
          // Prefer XL from same carrier, then fallback to any XL
          const [xsMatch, xsAny] = await Promise.all([
            Quote.findOne({ submissionId: submission._id, policyType: "EXCESS_LIABILITY", carrierId: baseQuote.carrierId }).populate("carrierId", "name").lean(),
            Quote.findOne({ submissionId: submission._id, policyType: "EXCESS_LIABILITY" }).populate("carrierId", "name").lean(),
          ]);
          xsQuote = xsMatch || xsAny;
        }
      } else {
        const [glDoc, xsDoc] = await Promise.all([
          Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, "GENERAL_LIABILITY"] } }).populate("carrierId", "name").lean(),
          Quote.findOne({ submissionId: submission._id, policyType: "EXCESS_LIABILITY" }).populate("carrierId", "name").lean(),
        ]);
        quote = glDoc;
        xsQuote = xsDoc;
      }

      agency = (await agencyPromise) || defaultAgency;
    } catch (error: any) {
      console.error("Error fetching agency/quotes:", error.message);
      agency = defaultAgency;
    }

    // Prepare form data
    const formData = submission.payload || {};

    // Prepare proposal data
    const populatedQuote = quote as unknown as IPopulatedQuote | null;
    let quoteNumber = "TBD";
    let programName = (submission as any).programName || "Advantage Contractor GL";
    let carrierQuoteUSD = 0;
    let premiumTaxPercent = 0;
    let premiumTaxAmountUSD = 0;
    let policyFeeUSD = 0;
    let brokerFeeAmountUSD = 0;
    let finalAmountUSD = 0;
    let effectiveDate = (formData?.effectiveDate || formData?.proposedEffectiveDateFrom) ? new Date(formData.effectiveDate || formData.proposedEffectiveDateFrom) : new Date();
    let expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    let limits: any = undefined;
    let endorsements: string[] = [];
    let specialNotes = "";

    // Option B: Calculate unique carriers across ALL quotes for this submission
    // and use them for the Carrier display fields to ensure consistency.
    const allQuotesForSubmission = await Quote.find({ submissionId: submission._id }).populate("carrierId", "name").lean();
    const uniqueCarrierNames = Array.from(new Set(allQuotesForSubmission.map((q: any) => q.carrierId?.name).filter(Boolean))) as string[];
    const uniqueExcessCarrierNames = Array.from(new Set(allQuotesForSubmission.filter((q: any) => q.policyType === "EXCESS_LIABILITY").map((q: any) => q.carrierId?.name).filter(Boolean))) as string[];
    const allExcessCarriersStr = uniqueExcessCarrierNames.join(" & ");
    
    let carrierName = uniqueCarrierNames[0] || populatedQuote?.carrierId?.name || "Unknown Carrier";
    let carrierNameXL = uniqueCarrierNames.length > 1 ? uniqueCarrierNames[1] : undefined;

    if (quote) {

      // carrierName assignment removed to prevent overwriting Option B value
      quoteNumber = String(populatedQuote?._id).substring(0, 8).toUpperCase();
      carrierQuoteUSD = quote.carrierQuoteUSD || 0;
      premiumTaxPercent = quote.premiumTaxPercent || 0;
      premiumTaxAmountUSD = quote.premiumTaxAmountUSD || 0;
      policyFeeUSD = quote.policyFeeUSD || 0;
      brokerFeeAmountUSD = quote.brokerFeeAmountUSD || 0;
      finalAmountUSD = quote.finalAmountUSD || 0;
      if (quote.effectiveDate) effectiveDate = new Date(quote.effectiveDate);
      if (quote.expirationDate) expirationDate = new Date(quote.expirationDate);
      limits = quote.limits || {};
      endorsements = quote.endorsements || [];
      specialNotes = quote.specialNotes || "";
    } else {
      limits = {}; // Fallback to empty object if no quote
    }

    // get class codes
    const classCodes = Object.keys(formData.classCodeWork || {});

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);
    const proposalData: ProposalData = {
      subcontractorCosts: formatToUSD(formData.estimatedSubcontractingCosts || "0"),
      quoteNumber,
      proposalDate: formatDateMMDDYYYY(new Date()),
      desiredCoverageDates: getPolicyDateRange(effectiveDate),
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
      agencyName:
        agency?.name?.includes("Capital & Co")
          ? "Capital & Co Insurance "
          : agency?.name || "Unknown Agency",
      agencyEmail: agency?.email || "",
      agencyPhone: agency?.phone || "",
      agencyAddress: agency?.address?.street || "",
      agencyState: agency?.address?.state || "",
      agencyZip: agency?.address?.zip || "",
      agencyCity: agency?.address?.city || "",
      classCode: classCodes.length > 0 ? classCodes.join(", ") : (formData.classCode || ""),
      carrierName,
      programName,
      effectiveDate: getPolicyDateRange(effectiveDate),
      expirationDate: formatDateMMDDYYYY(expirationDate),
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
      aggregateLimit: aggregate,
      productsCompletedOpsLimit: products,
      personalAdvertisingInjuryLimit: occurrence,
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData?.fireLegalLimit || "100000"),
      medPayLimit: (() => {
        const val = limits?.medicalExpenseLimit || formData?.medicalExpenseLimit || "5000";
        return val === "Not Applicable" ? val : formatToUSD(val);
      })(),
      deductible: formatToUSD(limits?.deductible || formData?.deductible || formData?.selfInsuredRetention || "2500"),
      selfInsuredRetention: formatToUSD(limits?.deductible || formData?.selfInsuredRetention || formData?.deductible || "2500"),


      employeePayroll: formatToUSD(formData.totalPayroll || formData.totalPayrollAmount || "$0"),

      descriptionOfOperations:
        formData.carrierApprovedDescription ||
        Object.values(formData.classCodeWork || {})
          .map((item: any) => item.description)
          .join(", "),
      // Excess Liability
      addExcessLiability: formData.addExcessLiability === true,
      isExcessOnlyProposal: url.searchParams.get("isExcessOnly") === "true",
      // excessLiabilityAmount and carrierNameXL handled below
      carrierNameXL: url.searchParams.get("isExcessOnly") === "true" ? (allExcessCarriersStr || carrierNameXL) : carrierNameXL,
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

    const templateType = useApartmentTemplate ? "apartment" : isCommercialProperty ? "commercial" : isContractors ? "contractors" : "standard";

    // 🚀 CACHE CHECK: Hash the proposalData JSON for stability
    const dataHash = crypto.createHash("md5").update(JSON.stringify(proposalData) + templateType).digest("hex");

    try {
      const cachedPdf = await PDFCache.findOne({ hash: dataHash }).lean();
      if (cachedPdf && cachedPdf.pdfBuffer) {
        console.log(`📄 [PDF Download] SERVING FAST CACHE for hash: ${dataHash.substring(0, 8)}...`);
        return new NextResponse(new Uint8Array(cachedPdf.pdfBuffer as unknown as ArrayBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${proposalData.companyName}-Proposal.pdf"`,
            'Content-Length': cachedPdf.pdfBuffer.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    } catch (cacheFetchErr) {
      console.warn("⚠️ [PDF Download] Cache check failed, falling back to generation:", cacheFetchErr);
    }

    // Generate proposal HTML after cache miss
    let proposalHTML: string = "";

    if (useApartmentTemplate) {
      console.log("📄 [Proposal Download] Generating Apartment Buildings Proposal...");
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
      console.log("📄 [Proposal Download] Generating Commercial Property Proposal...");
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
      console.log("📄 [Proposal Download] Generating Contractors Equipment Proposal...");
      const capitalCoLogoSVG = await loadCapitalCoLogo();
      const contractorsData = mapContractorsDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        (quote as any)?.carrierId?.name || "Capital & Co",
        submission,
        capitalCoLogoSVG
      );
      proposalHTML = generateContractorsProposalHTML(contractorsData);
    } else {
      proposalHTML = generateProposalHTML(proposalData);
    }

    // Generate PDF using production service (PDFShift)
    let pdfBuffer: Buffer;
    try {
      console.log("📄 [PDF Download] Starting PDF generation...");
      const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
      pdfBuffer = await generatePDFFromHTML({
        html: proposalHTML,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      });
      console.log(`📄 [PDF Download] PDF generated successfully - Size: ${pdfBuffer.length} bytes`);
    } catch (pdfError: any) {
      console.error("📄 [PDF Download] PDF generation error:", pdfError);
      console.error("📄 [PDF Download] Error message:", pdfError?.message);
      console.error("📄 [PDF Download] Error stack:", pdfError?.stack);

      // Return detailed error for debugging
      return NextResponse.json(
        {
          error: pdfError?.message || "Failed to generate PDF",
          details: process.env.NODE_ENV === 'development' ? pdfError?.stack : undefined
        },
        { status: 500 }
      );
    }

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error("📄 [PDF Download] PDF buffer is empty");
      return NextResponse.json(
        { error: "Generated PDF is empty" },
        { status: 500 }
      );
    }

    // Save generated PDF to MongoDB LRU Cache (non-blocking)
    PDFCache.create({ hash: dataHash, pdfBuffer }).catch(e =>
      console.error("⚠️ [PDF Download] Failed to save cache document asynchronously", e)
    );

    // Return PDF as response
    try {
      console.log("📄 [PDF Download] Returning PDF response...");
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${proposalData.companyName}-Proposal.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (responseError: any) {
      console.error("📄 [PDF Download] Error creating response:", responseError);
      return NextResponse.json(
        { error: "Failed to create PDF response" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("📄 [PDF Download] Unexpected error:", error);
    console.error("📄 [PDF Download] Error message:", error?.message);
    console.error("📄 [PDF Download] Error stack:", error?.stack);
    return NextResponse.json(
      {
        error: error?.message || "Failed to generate PDF",
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}