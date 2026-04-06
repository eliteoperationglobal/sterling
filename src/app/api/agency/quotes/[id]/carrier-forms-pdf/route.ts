import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Carrier from "@/models/Carrier";
import { generateCarrierFormsHTML } from "@/lib/services/pdf";
import { savePDFToStorage } from "@/lib/services/pdf/storage";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * GET /api/agency/quotes/[id]/carrier-forms-pdf
 * Generate and download Carrier Forms PDF for a quote
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

    // Prepare form data
    const formData = submission.payload || {};
    const carrier = quote.carrierId as any;

    // Prepare carrier forms data
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

    // Generate HTML
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

    // Log activity: Document generated
    await logActivity(
      createActivityLogData(
        "DOCUMENT_GENERATED",
        `Carrier Forms PDF generated for quote`,
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
            documentType: "CARRIER_FORM",
            documentUrl: pdfUrl,
          },
        }
      )
    );

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="carrier-forms-${quote._id.toString()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Carrier Forms PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate carrier forms PDF" },
      { status: 500 }
    );
  }
}

