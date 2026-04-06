import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
import { generateApplicationPacketHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";

/**
 * GET /api/admin/submissions/[id]/pdf
 * Generate and download application PDF (admin only)
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
    const userRole = user.role;

    // Only system_admin can access admin APIs
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    const applicationId = params.id;

    await connectDB();

    // Get application (admin can access any application)
    const submission = await Submission.findById(applicationId);

    if (!submission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Get agency details
    const agency = await Agency.findById(submission.agencyId);

    // Get quote if available (for invoice page)
    const quote = quoteId ? await Quote.findById(quoteId).populate("carrierId", "name") : await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name");

    // Load Capital & Co logo SVG
    const capitalCoLogoSVG = await loadCapitalCoLogo();

    // Map form data to packet data format
    const formData = submission.payload || {};
    const packetData = mapFormDataToPacketData(
      formData,
      submission._id.toString(),
      agency,
      quote ? quote.toObject() : undefined,
      submission,
      capitalCoLogoSVG
    );

    // Generate 12-page application packet HTML
    const htmlContent = await generateApplicationPacketHTML(packetData);

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

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        // 'Content-Disposition': `attachment; filename="application-${submission._id.toString()}.pdf"`,
        'Content-Disposition': `attachment; filename="${formData.companyName}-Application.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}








