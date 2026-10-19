import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import Quote from "@/models/Quote";
import { generateInvoiceHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { generateApartmentInvoiceHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { generateContractorsInvoiceHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { mapBuildersRiskDataToPacketData } from "@/lib/services/pdf/mappers/buildersRiskMapper";
import { generateBuildersRiskInvoiceHTML } from "@/lib/services/pdf/BuildersRiskPacketPDF";
import { mapManufacturersDataToPacketData } from "@/lib/services/pdf/mappers/manufacturersMapper";
import { generateManufacturersInvoiceHTML } from "@/lib/services/pdf/ManufacturersPacketPDF";

/**
 * GET /api/admin/submissions/[id]/invoice
 * Generate and download invoice PDF (Admin version)
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
    const policyTypeParam = url.searchParams.get("policyType");
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
    let quote: any = null;
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
      console.log("📄 [Admin Invoice Download] Generating Apartment Buildings Invoice...");
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
      console.log("📄 [Admin Invoice Download] Generating Contractors Equipment Invoice...");
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
      console.log("📄 [Admin Invoice Download] Generating Builders Risk Invoice...");
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
      console.log("📄 [Admin Invoice Download] Generating Manufacturers Invoice...");
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

    // Generate PDF
    const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
    const pdfBuffer = await generatePDFFromHTML({
      html: invoiceHTML,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "Generated PDF is empty" }, { status: 500 });
    }

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
  } catch (error: any) {
    console.error("📄 [Admin Invoice Download] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}