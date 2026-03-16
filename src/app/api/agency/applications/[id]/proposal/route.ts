
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
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
  medicalExpenseLimit?: string;
  aggregateLimit?: string;
  deductible?: string;
  selfInsuredRetention?: string;

  carrierQuoteUSD: number;
  premiumTaxPercent: number;
  premiumTaxAmountUSD: number;
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

    // Get agency details
    let agency: any = null;
    try {
      agency = await Agency.findById(user.agencyId);
    } catch (error: any) {
      console.error("Error fetching agency:", error.message);
      // Use default agency info as fallback
      agency = {
        name: "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services",
        email: "eidan@capcoinsurance.com",
        phone: "(310) 284-2136",
        address: {
          street: "5455 Wilshire Blvd. Suite 1816",
          city: "Los Angeles",
          state: "CA",
          zip: "90036",
        },
      };
    }

    // Get quote if available (for proposal page)
    let quote: any = null;
    try {
      quote = await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name");
      if (quote) {
        quote = quote.toObject();
      }
    } catch (error: any) {
      console.warn("Error fetching quote (optional):", error.message);
      // Quote is optional, continue without it
    }

    // Prepare form data
    const formData = submission.payload || {};

    // Prepare proposal data
    let carrierName = quote?.carrierId?.name || "Unknown Carrier";
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
      
      carrierName = quote?.carrierId?.name || "Unknown Carrier";
      quoteNumber = quote._id.toString().substring(0, 8).toUpperCase();
      carrierQuoteUSD = quote.carrierQuoteUSD || 0;
      premiumTaxPercent = quote.premiumTaxPercent || 0;
      premiumTaxAmountUSD = quote.premiumTaxAmountUSD || 0;
      policyFeeUSD = quote.policyFeeUSD || 0;
      brokerFeeAmountUSD = quote.brokerFeeAmountUSD || 0;
      finalAmountUSD = quote.finalAmountUSD || 0;
      if (quote.effectiveDate) effectiveDate = new Date(quote.effectiveDate).toLocaleDateString();
      if (quote.expirationDate) expirationDate = new Date(quote.expirationDate).toLocaleDateString();
      limits = quote.limits || {};
      endorsements = quote.endorsements || [];
      specialNotes = quote.specialNotes || "";
    } else {
      console.log("🔍 [Proposal API] No quote found for submission:", submission._id);
      limits = {}; // Fallback to empty object if no quote
    }

    
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
      classCode: formData.classCode || "",
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
      occurrenceLimit: formatToUSD(limits?.generalLiability),
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit),
      medicalExpenseLimit: formatToUSD(limits?.medicalExpenseLimit),
      personalAdvertisingInjuryLimit: formatToUSD(limits?.personalAdvertisingInjury),
      aggregateLimit: formatToUSD(limits?.aggregateLimit),
      productsCompletedOpsLimit: formatToUSD(limits?.productsCompletedOps),
      deductible: formatToUSD(limits?.deductible),
      selfInsuredRetention: formatToUSD(limits?.deductible),

      employeePayroll: formatToUSD(formData.totalPayrollAmount || "$0"),

      descriptionOfOperations:
        formData.carrierApprovedDescription ||
        formData.classCodeWork?.description ||
        "",
    };
    
    // Generate proposal HTML using ProposalData
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

    // Return PDF as response
    try {
      console.log("📄 [PDF Download] Returning PDF response...");
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${proposalData.companyName}-Proposal.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
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
