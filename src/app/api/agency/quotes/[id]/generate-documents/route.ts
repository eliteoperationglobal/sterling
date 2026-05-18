import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Carrier from "@/models/Carrier";
import { generateProposalHTML } from "@/lib/services/pdf";
import { generateCarrierFormsHTML } from "@/lib/services/pdf";
import { savePDFToStorage } from "@/lib/services/pdf/storage";

function formatDateMMDDYYYY(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/**
 * POST /api/agency/quotes/[id]/generate-documents
 * Generate Proposal and Carrier Forms PDFs and store them in submission
 */
export async function POST(
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

    // Get submission document to update
    const submissionDoc = await Submission.findById(submission._id);
    if (!submissionDoc) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Initialize signedDocuments array if it doesn't exist
    if (!submissionDoc.signedDocuments) {
      submissionDoc.signedDocuments = [];
    }

    const generatedDocuments: any[] = [];

    // Generate Proposal PDF if not already generated
    const hasProposal = submissionDoc.signedDocuments.some(
      (doc: any) => doc.documentType === "PROPOSAL"
    );

    if (!hasProposal) {
      console.log("📄 Generating Proposal PDF...");

      const proposalData = {
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
        programName: (submission as any).programName || "Advantage Contractor GL",
        effectiveDate: quote.effectiveDate ? formatDateMMDDYYYY(quote.effectiveDate) : formatDateMMDDYYYY(new Date()),
        expirationDate: quote.expirationDate ? formatDateMMDDYYYY(quote.expirationDate) : formatDateMMDDYYYY(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        carrierQuoteUSD: quote.carrierQuoteUSD,
        premiumTaxPercent: quote.premiumTaxPercent,
        premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
        policyFeeUSD: quote.policyFeeUSD || 0,
        brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
        finalAmountUSD: quote.finalAmountUSD,
        limits: quote.limits,
        endorsements: quote.endorsements || [],
        specialNotes: quote.specialNotes,
        grossReceipts: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString(); })(formData.estimatedGrossReceipts || formData.classCodes?.[0]?.grossReceipts || formData.classCode?.[0]?.grossReceipts || "0"),
        subcontractorCosts: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString(); })(formData.estimatedSubcontractingCosts || "0"),
        employeePayroll: (function (val: any) { if (!val) return "$0"; const s = String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g, "")).toLocaleString(); })(formData.totalPayroll || formData.totalPayrollAmount || "0"),
        descriptionOfOperations: formData.carrierApprovedDescription || formData.classCodeWork?.description || formData.descriptionOfOperations || "",
      };

      const htmlContent = generateProposalHTML(proposalData);

      // Generate PDF using production service (PDFShift)
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

      // Add to submission documents
      submissionDoc.signedDocuments.push({
        documentType: "PROPOSAL",
        documentName: `Proposal_${quote._id.toString()}.pdf`,
        documentUrl: pdfUrl,
        generatedAt: new Date(),
        signatureStatus: "GENERATED",
      });

      generatedDocuments.push({ type: "PROPOSAL", url: pdfUrl });
      console.log("✅ Proposal PDF generated and stored");
    }

    // Generate Carrier Forms PDF if not already generated
    const hasCarrierForms = submissionDoc.signedDocuments.some(
      (doc: any) => doc.documentType === "CARRIER_FORM"
    );

    if (!hasCarrierForms) {
      console.log("📄 Generating Carrier Forms PDF...");

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
        programName: (submission as any).programName || "Advantage Contractor GL",
        applicationData: formData,
      };

      const htmlContent = generateCarrierFormsHTML(carrierFormsData);

      // Generate PDF using production service (PDFShift)
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
      const fileName = `carrier-forms-${quote._id.toString()}.pdf`;
      const pdfUrl = await savePDFToStorage(pdfBuffer, fileName);

      // Add to submission documents
      submissionDoc.signedDocuments.push({
        documentType: "CARRIER_FORM",
        documentName: `Carrier_Forms_${quote._id.toString()}.pdf`,
        documentUrl: pdfUrl,
        generatedAt: new Date(),
        signatureStatus: "GENERATED",
      });

      generatedDocuments.push({ type: "CARRIER_FORM", url: pdfUrl });
      console.log("✅ Carrier Forms PDF generated and stored");
    }

    // Save submission with updated documents
    submissionDoc.markModified("signedDocuments");
    await submissionDoc.save();

    return NextResponse.json({
      success: true,
      documentsGenerated: generatedDocuments.length,
      documents: generatedDocuments,
      message: `${generatedDocuments.length} document(s) generated and stored`,
    });
  } catch (error: any) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate documents" },
      { status: 500 }
    );
  }
}