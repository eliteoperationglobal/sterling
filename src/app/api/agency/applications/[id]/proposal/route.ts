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
  // If it's already a formatted string with $, return it
  if (typeof value === "string" && (value.includes("$") || value.includes("/"))) {
    return value;
  }
  const str = String(value).replace(/[$,]/g, "");
  const num = Number(str);
  if (isNaN(num)) return String(value);
  return `$${num.toLocaleString()}`;
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

    // 🚀 PARALLEL: Fetch agency + GL quote + XS quote simultaneously
    const defaultAgency = {
      name: "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services",
      email: "eidan@capcoinsurance.com",
      phone: "(310) 284-2136",
      address: { street: "5455 Wilshire Blvd. Suite 1816", city: "Los Angeles", state: "CA", zip: "90036" },
    };

    let agency: any;
    let quote: any = null;
    let xsQuote: any = null;

    try {
      const [agencyDoc, quoteDoc, xsQuoteDoc] = await Promise.all([
        Agency.findById(user.agencyId).lean(),
        quoteId
          ? Quote.findById(quoteId).populate("carrierId", "name").lean()
          : Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, "GENERAL_LIABILITY"] } })
            .populate("carrierId", "name")
            .lean(),
        Quote.findOne({ submissionId: submission._id, policyType: "EXCESS_LIABILITY" }).lean(),
      ]);
      agency = agencyDoc || defaultAgency;
      quote = quoteDoc || null;
      xsQuote = xsQuoteDoc || null;
    } catch (error: any) {
      console.error("Error fetching agency/quotes:", error.message);
      agency = defaultAgency;
    }

    // Prepare form data
    const formData = submission.payload || {};

    // Prepare proposal data
    const populatedQuote = quote as unknown as IPopulatedQuote | null;
    let carrierName = populatedQuote?.carrierId?.name || "Unknown Carrier";
    let quoteNumber = "TBD";
    let programName = (submission as any).programName || "Advantage Contractor GL";
    let carrierQuoteUSD = 0;
    let premiumTaxPercent = 0;
    let premiumTaxAmountUSD = 0;
    let policyFeeUSD = 0;
    let brokerFeeAmountUSD = 0;
    let finalAmountUSD = 0;
    let effectiveDate = new Date().toLocaleDateString();
    let expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
    let limits = undefined;
    let endorsements = [];
    let specialNotes = "";

    if (quote) {
      console.log("🔍 [Proposal API] Quote found:", quote._id);
      console.log("🔍 [Proposal API] Quote limits:", JSON.stringify(quote.limits, null, 2));

      carrierName = populatedQuote?.carrierId?.name || "Unknown Carrier";
      quoteNumber = String(populatedQuote?._id).substring(0, 8).toUpperCase();
      carrierQuoteUSD = quote.carrierQuoteUSD || 0;
      premiumTaxPercent = quote.premiumTaxPercent || 0;
      premiumTaxAmountUSD = quote.premiumTaxAmountUSD || 0;
      policyFeeUSD = quote.policyFeeUSD || 0;
      brokerFeeAmountUSD = quote.brokerFeeAmountUSD || 0;
      finalAmountUSD = quote.finalAmountUSD || 0;
      if (quote.effectiveDate) effectiveDate = new Date(quote.effectiveDate).toLocaleDateString();
      if (quote.expirationDate) expirationDate = new Date(quote.expirationDate).toLocaleDateString();
      limits = quote.limits || {};
      console.log("🔥 LIMITS FULL DATA:", JSON.stringify(limits, null, 2));
      endorsements = quote.endorsements || [];
      specialNotes = quote.specialNotes || "";
    } else {
      console.log("🔍 [Proposal API] No quote found for submission:", submission._id);
      limits = {}; // Fallback to empty object if no quote
    }

    // get class codes
    const classCodes = Object.keys(formData.classCodeWork || {});
    console.log("🔥 CLASS CODES:", classCodes);

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);
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
      aggregateLimit: aggregate,
      productsCompletedOpsLimit: products,
      personalAdvertisingInjuryLimit: occurrence,
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData?.fireLegalLimit),
      medPayLimit: limits?.medicalExpenseLimit && limits.medicalExpenseLimit !== "Not Applicable" ? formatToUSD(limits.medicalExpenseLimit) : "Not Applicable",
      deductible: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),
      selfInsuredRetention: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),


      employeePayroll: formatToUSD(formData.totalPayroll || formData.totalPayrollAmount || "$0"),

      descriptionOfOperations:
        formData.carrierApprovedDescription ||
        Object.values(formData.classCodeWork || {})
          .map((item: any) => item.description)
          .join(", "),
      // Excess Liability
      addExcessLiability: formData.addExcessLiability === true,
      excessLiabilityAmount: xsQuote?.finalAmountUSD ?? undefined,
      excessLiabilityLimit: (xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit) ? extractLimits(xsQuote?.limits?.excessLimit || formData.excessLiabilityLimit)[0] : undefined,
    };

    // 🚀 STABLE CACHE KEY: Hash proposalData JSON (not HTML) for stability
    const dataHash = crypto.createHash("md5").update(JSON.stringify(proposalData)).digest("hex");

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
    const proposalHTML = generateProposalHTML(proposalData);

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