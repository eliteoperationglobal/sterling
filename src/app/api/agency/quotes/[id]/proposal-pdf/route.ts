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

    // Prepare proposal data
    const proposalData = {
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
      carrierName: carrier.name,
      carrierReference: quote.carrierReference,
      programName: (submission as any).programName || "Advantage Contractor GL",
      effectiveDate: quote.effectiveDate ? new Date(quote.effectiveDate).toLocaleDateString() : new Date().toLocaleDateString(),
      expirationDate: quote.expirationDate ? new Date(quote.expirationDate).toLocaleDateString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      carrierQuoteUSD: quote.carrierQuoteUSD,
      premiumTaxPercent: quote.premiumTaxPercent,
      premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
      policyFeeUSD: quote.policyFeeUSD || 0,
      brokerFeeAmountUSD: quote.brokerFeeAmountUSD || 0,
      finalAmountUSD: quote.finalAmountUSD,
      limits: quote.limits,
      endorsements: quote.endorsements || [],
      specialNotes: quote.specialNotes,
      grossReceipts: (function(val: any) { if (!val) return "$0"; const s=String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g,"")).toLocaleString(); })(formData.estimatedGrossReceipts || formData.classCodes?.[0]?.grossReceipts || formData.classCode?.[0]?.grossReceipts || "0"),
      subcontractorCosts: (function(val: any) { if (!val) return "$0"; const s=String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g,"")).toLocaleString(); })(formData.estimatedSubcontractingCosts || "0"),
      employeePayroll: (function(val: any) { if (!val) return "$0"; const s=String(val); return s.includes("$") ? s : "$" + Number(s.replace(/[^0-9.-]+/g,"")).toLocaleString(); })(formData.totalPayroll || formData.totalPayrollAmount || "0"),
      descriptionOfOperations: formData.carrierApprovedDescription || formData.classCodeWork?.description || formData.descriptionOfOperations || "",
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

