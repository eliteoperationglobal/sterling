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

function getPolicyDateRange(dateInput: string | Date) {
  const start = new Date(dateInput);

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
  if (typeof value === "string" && (value.includes("$") || value.includes("/"))) {
    return value;
  }
  const str = String(value).replace(/[$,]/g, "");
  const num = Number(str);
  if (isNaN(num)) return String(value);
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
    let effectiveDate = quote?.effectiveDate ? new Date(quote.effectiveDate).toLocaleDateString() : new Date().toLocaleDateString();
    let expirationDate = quote?.expirationDate ? new Date(quote.expirationDate).toLocaleDateString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
    let limits = quote?.limits || {};
    let endorsements = quote?.endorsements || [];
    let specialNotes = quote?.specialNotes || "";

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);

    // get class codes
    const classCodes = Object.keys(formData.classCodeWork || {});

    const proposalData: ProposalData = {
      subcontractorCosts: formatToUSD(formData.estimatedSubcontractingCosts || "0"),
      quoteNumber,
      proposalDate: new Date().toLocaleDateString(),
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
      expirationDate,
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
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData?.fireLegalLimit),
      medPayLimit: limits?.medicalExpenseLimit && limits.medicalExpenseLimit !== "Not Applicable" ? formatToUSD(limits.medicalExpenseLimit) : "Not Applicable",
      personalAdvertisingInjuryLimit: occurrence,
      aggregateLimit: aggregate,
      productsCompletedOpsLimit: products,
      deductible: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),
      selfInsuredRetention: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),
      employeePayroll: formatToUSD(formData.totalPayroll || formData.totalPayrollAmount || "$0"),
      descriptionOfOperations:
        formData.carrierApprovedDescription ||
        (formData.classCodeWork ? Object.values(formData.classCodeWork).map((item: any) => item.description).join(", ") : "") ||
        "",
      // Excess Liability
      addExcessLiability: formData.addExcessLiability === true,
      excessLiabilityAmount: xsQuote?.finalAmountUSD ?? undefined,
      excessLiabilityLimit: (xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit) ? extractLimits(xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit)[0] : undefined,
    };

    // 🚀 CACHE CHECK: Hash the proposalData JSON for stability
    const dataHash = crypto.createHash("md5").update(JSON.stringify(proposalData)).digest("hex");

    try {
      const cachedPdf = await PDFCache.findOne({ hash: dataHash }).lean();
      if (cachedPdf && cachedPdf.pdfBuffer) {
        console.log(`📄 [Admin PDF Download] SERVING FAST CACHE for hash: ${dataHash.substring(0, 8)}...`);
        return new NextResponse(new Uint8Array(cachedPdf.pdfBuffer as unknown as ArrayBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${formData.companyName}-Proposal.pdf"`,
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

    if (submission.programId === "apartment-buildings") {
      console.log("📄 [Admin Proposal Download] Generating Apartment Buildings Proposal...");
      const apartmentData = mapApartmentDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission
      );
      proposalHTML = generateApartmentProposalHTML(apartmentData);
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

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formData.companyName}-Proposal.pdf"`,
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
