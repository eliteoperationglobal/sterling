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

function extractLimits(value: string) {
  if (!value) return ["", "", ""];

  const parts = value.split("/").map(v => v.trim());

  return parts.map((v: string) => {
    // Check if it's already a full dollar amount
    if (v.includes("$") || v.length > 5) return v;
    const num = parseFloat(v) * 1000000;
    if (isNaN(num)) return v;
    return "$" + num.toLocaleString();
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
  return `$${num.toLocaleString()}`;
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
      quoteId ? Quote.findById(quoteId).populate("carrierId", "name") : Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, 'GENERAL_LIABILITY'] } }).populate("carrierId", "name"),
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
    let effectiveDate = quote?.effectiveDate ? new Date(quote.effectiveDate) : new Date();
    let expirationDate = quote?.expirationDate ? new Date(quote.expirationDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    let limits = quote?.limits || {};
    let endorsements = quote?.endorsements || [];
    let specialNotes = quote?.specialNotes || "";

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);

    // get class codes
    const classCodes = Object.keys(formData.classCodeWork || {});

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
      agencyName: agency?.name || "Unknown Agency",
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
      addExcessLiability: policyTypeParams ? policyTypeParams === "EXCESS_LIABILITY" : formData.addExcessLiability === true,
      isExcessOnlyProposal: url.searchParams.get("isExcessOnly") === "true",
      excessLiabilityAmount: xsQuote?.finalAmountUSD ?? undefined,
      excessLiabilityLimit: (xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit) ? extractLimits(xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit)[0] : undefined,
    };

    // 🚀 CACHE CHECK: Hash the proposalData JSON for stability
    const dataHash = crypto.createHash("md5").update(JSON.stringify(proposalData)).digest("hex");

    const isApartment = submission.programId === "apartment-buildings" || 
                        submission.programName?.toLowerCase().includes("apartment building") || 
                        submission.programName?.toLowerCase().includes("commercial property");

    const isContractors = submission.programId === "contractors-equipment" || 
                         submission.programName?.toLowerCase().includes("contractors equipment");

    try {
      const cachedPdf = await PDFCache.findOne({ hash: dataHash }).lean();
      if (cachedPdf && cachedPdf.pdfBuffer) {
        console.log(`📄 [Admin PDF Download] SERVING FAST CACHE for hash: ${dataHash.substring(0, 8)}...`);
        const policyLabel = isApartment 
          ? (quote?.policyType === 'EXCESS_LIABILITY' ? 'General-Liability' : 'Property')
          : isContractors ? 'Equipment' : 'Proposal';
        const filename = isApartment || isContractors
          ? `${formData.companyName}-${policyLabel}-Proposal.pdf`
          : `${formData.companyName}-Proposal.pdf`;

        return new NextResponse(new Uint8Array(cachedPdf.pdfBuffer as unknown as ArrayBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': cachedPdf.pdfBuffer.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    } catch (cacheFetchErr) {
      console.warn("⚠️ [Admin PDF Download] Cache check failed, falling back to generation:", cacheFetchErr);
    }

    // Generate proposal HTML
    let proposalHTML: string = "";

    if (isApartment) {
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

    // Save generated PDF to MongoDB LRU Cache (non-blocking)
    try {
      PDFCache.create({ hash: dataHash, pdfBuffer }).catch(e => console.error("⚠️ [Admin PDF Download] Failed to save cache document asynchronously", e));
    } catch (e) {
      // Ignored
    }

    const policyLabel = isApartment 
      ? (quote?.policyType === 'EXCESS_LIABILITY' ? 'General-Liability' : 'Property')
      : isContractors ? 'Equipment' : 'Proposal';
    const filename = isApartment || isContractors
      ? `${formData.companyName}-${policyLabel}-Proposal.pdf`
      : `${formData.companyName}-Proposal.pdf`;

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
