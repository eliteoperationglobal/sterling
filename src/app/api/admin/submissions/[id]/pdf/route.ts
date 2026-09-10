import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
import { generateApplicationPacketHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { generateApartmentPacketHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { generateContractorsPacketHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { generateBuildersRiskPacketHTML } from "@/lib/services/pdf/BuildersRiskPacketPDF";
import { generateManufacturersPacketHTML } from "@/lib/services/pdf/ManufacturersPacketPDF";
import { mapManufacturersDataToPacketData } from "@/lib/services/pdf/mappers/manufacturersMapper";

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
    const quote = quoteId ? await Quote.findById(quoteId).populate("carrierId", "name") : await Quote.findOne({ submissionId: submission._id, policyType: { $in: [null, 'GENERAL_LIABILITY'] } }).populate("carrierId", "name");

    // Load Capital & Co logo SVG
    const capitalCoLogoSVG = await loadCapitalCoLogo();

    // Map form data to packet data format
    const formData = submission.payload || {};

    let htmlContent: string = "";

    const isApartment = submission.programId === "apartment-buildings" || 
                        submission.programName?.toLowerCase().includes("apartment building") || 
                        submission.programName?.toLowerCase().includes("commercial property");

    const isContractors = submission.programId === "contractors-equipment" || 
                         submission.programName?.toLowerCase().includes("contractors equipment") ||
                         submission.programName?.toLowerCase().includes("construction equipment");

    const isBuildersRisk = submission.programId === "builders-risk" || 
                           submission.programName?.toLowerCase().includes("builders risk") ||
                           submission.programName?.toLowerCase().includes("builder's risk");

    const isManufacturers = submission.programId === "manufacturers" || 
                            submission.programName?.toLowerCase().includes("manufacturers") ||
                            submission.programName?.toLowerCase().includes("distributors");

    if (isApartment) {
      console.log("📄 [Admin PDF Download] Generating Commercial Property PDF...");
      const apartmentData = mapApartmentDataToPacketData(
        formData,
        submission.submissionNumber?.toString() || submission._id.toString(),
        agency,
        quote ? quote.toObject() : undefined,
        submission,
        capitalCoLogoSVG
      );
      htmlContent = generateApartmentPacketHTML(apartmentData);
    } else if (isContractors) {
      console.log("📄 [Admin PDF Download] Generating Contractors Equipment PDF...");
      const contractorsData = mapContractorsDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        (quote as any)?.carrierId?.name || "Capital & Co",
        submission,
        capitalCoLogoSVG,
        quote
      );
      htmlContent = generateContractorsPacketHTML(contractorsData);
    } else if (isBuildersRisk) {
      console.log("📄 [PDF Download] Generating Builders Risk PDF...");
      htmlContent = generateBuildersRiskPacketHTML(formData);
    } else if (isManufacturers) {
      console.log("📄 [PDF Download] Generating Manufacturers PDF...");
      const manufacturersData = mapManufacturersDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote ? quote.toObject() : undefined,
        submission,
        capitalCoLogoSVG
      );
      htmlContent = generateManufacturersPacketHTML(manufacturersData);
    } else {
      const packetData = mapFormDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote ? quote.toObject() : undefined,
        submission,
        capitalCoLogoSVG
      );

      // Generate 12-page application packet HTML
      htmlContent = await generateApplicationPacketHTML(packetData);
    }

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

    const filename = isApartment 
      ? `${formData.companyName || formData.applicantName || 'Application'}-Property-Application.pdf`
      : isContractors
        ? `${formData.companyName || formData.applicantName || 'Application'}-Equipment-Application.pdf`
        : isBuildersRisk
          ? `${formData.companyName || formData.applicantName || 'Application'}-Builders-Risk-Application.pdf`
          : isManufacturers
            ? `${formData.companyName || formData.applicantName || 'Application'}-Manufacturers-Application.pdf`
            : `${formData.companyName || formData.applicantName || 'Application'}-Application.pdf`;

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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








