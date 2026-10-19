import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
import { generateInvoiceHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { generateApartmentInvoiceHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { generateContractorsInvoiceHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { mapBuildersRiskDataToPacketData } from "@/lib/services/pdf/mappers/buildersRiskMapper";
import { generateBuildersRiskInvoiceHTML } from "@/lib/services/pdf/BuildersRiskPacketPDF";
import { mapManufacturersDataToPacketData } from "@/lib/services/pdf/mappers/manufacturersMapper";
import { generateManufacturersInvoiceHTML } from "@/lib/services/pdf/ManufacturersPacketPDF";

/**
 * GET /api/agency/applications/[id]/invoice
 * Generate and download invoice PDF
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
          street: "292 S La Cienega Blvd Ste 206",
          city: "Beverly Hills",
          state: "CA",
          zip: "90211",
        },
      };
    }

    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quoteId");
    const policyTypeParam = url.searchParams.get("policyType");

    // Get quote if available (for invoice page)
    let quote: any = null;
    try {
      if (quoteId) {
        quote = await Quote.findById(quoteId).populate("carrierId", "name");
      }
      if (!quote && policyTypeParam) {
        quote = await Quote.findOne({ submissionId: submission._id, policyType: policyTypeParam }).populate("carrierId", "name");
      }
      if (!quote) {
        quote = await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name");
      }
      if (quote) {
        quote = quote.toObject();
      }
    } catch (error: any) {
      console.warn("Error fetching quote (optional):", error.message);
      // Quote is optional, continue without it
    }

    // Load Capital & Co logo SVG
    const capitalCoLogoSVG = await loadCapitalCoLogo();

    // Map form data to packet data format
    const formData = submission.payload || {};

    let invoiceHTML: string = "";

    const isApartment = submission.programId === "apartment-buildings" ||
      submission.programName?.toLowerCase().includes("apartment building") ||
      submission.programName?.toLowerCase().includes("commercial property");

    const isContractors = submission.programId === "contractors-equipment" ||
      submission.programId === "inland-marine" ||
      submission.payload?.programId === "contractors-equipment" ||
      submission.payload?.programId === "inland-marine" ||
      submission.programName?.toLowerCase().includes("contractors equipment") ||
      submission.programName?.toLowerCase().includes("inland marine") ||
      submission.programName?.toLowerCase().includes("construction equipment") ||
      submission.programName?.toLowerCase().includes("equipment");

    const isBuildersRisk = submission.programId === "builders-risk" ||
      submission.programName?.toLowerCase().includes("builders risk");

    const isManufacturers = submission.programId === "manufacturers" ||
      submission.programName?.toLowerCase().includes("manufacturers");

    if (isApartment) {
      console.log("📄 [Invoice Download] Generating Apartment Buildings Invoice...");
      const apartmentData = mapApartmentDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission,
        capitalCoLogoSVG
      );
      invoiceHTML = generateApartmentInvoiceHTML(apartmentData);
    } else if (isContractors) {
      console.log("📄 [Invoice Download] Generating Contractors Equipment Invoice...");
      const contractorsData = mapContractorsDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        (quote as any)?.carrierId?.name || "Capital & Co",
        submission,
        capitalCoLogoSVG,
        quote
      );
      invoiceHTML = generateContractorsInvoiceHTML(contractorsData);
    } else if (isBuildersRisk) {
      console.log("📄 [Invoice Download] Generating Builders Risk Invoice...");
      const buildersRiskData = mapBuildersRiskDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission,
        capitalCoLogoSVG
      );
      invoiceHTML = generateBuildersRiskInvoiceHTML(buildersRiskData);
    } else if (isManufacturers) {
      console.log("📄 [Invoice Download] Generating Manufacturers Invoice...");
      const manufacturersData = mapManufacturersDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission,
        capitalCoLogoSVG
      );
      invoiceHTML = generateManufacturersInvoiceHTML(manufacturersData);
    } else {
      const packetData = mapFormDataToPacketData(
        formData,
        submission._id.toString(),
        agency,
        quote,
        submission,
        capitalCoLogoSVG
      );

      // Generate invoice HTML
      invoiceHTML = await generateInvoiceHTML(packetData);
    }

    // Generate PDF using production service (PDFShift)
    let pdfBuffer: Buffer;
    try {
      console.log("📄 [PDF Download] Starting PDF generation...");
      const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
      pdfBuffer = await generatePDFFromHTML({
        html: invoiceHTML,
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
      const getPolicyLabelForFilename = (type?: string) => {
        const norm = (type || "").toUpperCase().trim();
        if (isApartment) {
          if (norm === "PROFESSIONAL_LIABILITY" || norm === "PROFESSIONAL") return "Professional-Liability";
          if (norm === "POLLUTION_LIABILITY" || norm === "POLLUTION") return "Pollution-Liability";
          return norm === "EXCESS_LIABILITY" || norm === "EXCESS" ? "General-Liability" : "Commercial-Property";
        }
        if (isContractors) return "Equipment";
        if (isBuildersRisk) return "Builders-Risk";
        if (isManufacturers) return "Manufacturers";
        if (norm === "PROFESSIONAL_LIABILITY" || norm === "PROFESSIONAL") return "Professional-Liability";
        if (norm === "POLLUTION_LIABILITY" || norm === "POLLUTION") return "Pollution-Liability";
        if (norm === "EXCESS_LIABILITY" || norm === "EXCESS") return "Excess-Liability";
        return "General-Liability";
      };

      const policyLabel = getPolicyLabelForFilename(quote?.policyType || policyTypeParam);
      const customerName = (formData.companyName || formData.applicantName || submission.clientContact?.name || "Client")
        .replace(/[^a-zA-Z0-9-_\s]/g, "").trim().replace(/\s+/g, "-");
      const filename = `${customerName}-${policyLabel}-Invoice.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
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