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

    // Get agency details from submission
    let agency: any = await Agency.findById(submission.agencyId);
    if (!agency) {
      agency = {
        name: "Unknown Agency",
        email: "",
        phone: "",
        address: { street: "", city: "", state: "", zip: "" }
      };
    }

    // Get quote if available
    let quote: any = await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name");
    if (quote) {
      quote = quote.toObject();
    }

    // Prepare form data
    const formData = submission.payload || {};

    // Prepare proposal data (copied logic from agency API)
    let carrierName = quote?.carrierId?.name || "Unknown Carrier";
    let quoteNumber = quote ? quote._id.toString().substring(0, 8).toUpperCase() : "TBD";
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
    
    // Generate proposal HTML
    const proposalHTML = generateProposalHTML(proposalData);

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

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${submission._id.toString()}.pdf"`,
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
