import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import GeneratedLink from "@/models/GeneratedLink";
import jwt from "jsonwebtoken";
import { generateApplicationPacketHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";
import { generateApartmentPacketHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { generateContractorsPacketHTML } from "@/lib/services/pdf/ContractorsEquipmentPacketPDF";
import { generateManufacturersPacketHTML } from "@/lib/services/pdf/ManufacturersPacketPDF";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { mapContractorsDataToPacketData } from "@/lib/services/pdf/mappers/contractorsMapper";
import { savePDFToStorage } from "@/lib/services/pdf/storage";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import { getDisplayProgramName } from "@/utils/formatters";

/**
 * Generate unique application number
 */
function generateApplicationNumber(): string {
  const prefix = "APP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function normalizeSubcontractors(formData: any) {
  if (formData?.useSubcontractors === false) {
    return {
      ...formData,
      subcontractors: {
        useSubcontractors: false,
        collectCertificates: false,
        requireEqualLimits: false,
        requireAdditionalInsured: false,
        haveWrittenContracts: false,
        requireWorkersComp: false,
        collectCertificatesExplanation: "I do not use subcontractors.",
        requireEqualLimitsExplanation: "I do not use subcontractors.",
        requireAdditionalInsuredExplanation: "I do not use subcontractors.",
        haveWrittenContractsExplanation: "I do not use subcontractors.",
        requireWorkersCompExplanation: "I do not use subcontractors.",
      },
    };
  }

  if (formData?.useSubcontractors === true) {
    return {
      ...formData,
      subcontractors: {
        useSubcontractors: true,
        collectCertificates: formData.collectSubCertificates ?? false,
        collectCertificatesExplanation: formData.collectSubCertificatesExplanation || "",
        requireEqualLimits: formData.requireSubInsuranceEqual ?? false,
        requireEqualLimitsExplanation: formData.requireSubInsuranceEqualExplanation || "",
        requireAdditionalInsured: formData.requireAdditionalInsured ?? false,
        requireAdditionalInsuredExplanation: formData.requireAdditionalInsuredExplanation || "",
        haveWrittenContracts: formData.haveWrittenSubContracts ?? false,
        haveWrittenContractsExplanation: formData.haveWrittenSubContractsExplanation || "",
        requireWorkersComp: formData.requireWorkersComp ?? false,
        requireWorkersCompExplanation: formData.requireWorkersCompExplanation || "",
      },
    };
  }

  return formData;
}

function normalizeAdditionalCoverages(formData: any) {
  return {
    ...formData,
    inlandMarineEquipment: formData.addInlandMarineEquipment ?? false,
    buildersRisk: formData.addBuildersRisk ?? false,
    environmentalCoverage: formData.addEnvironmentalCoverage ?? false,
    generalLiability: formData.addGeneralLiability ?? false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { programId, programName, formData, carrierEmail, token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing public token" }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback_secret";
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    await connectDB();

    const link = await GeneratedLink.findOne({ jti: decoded.jti });
    if (!link || link.used || link.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link is invalid, expired, or already used." }, { status: 403 });
    }

    if (!programId || !formData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔒 Required client contact validation
    if (
      !formData?.phone ||
      !formData?.email ||
      !formData?.streetAddress ||
      !formData?.city
    ) {
      if (programId !== "apartment-buildings" && programId !== "manufacturers") {
        return NextResponse.json(
          {
            error: "Missing required client contact details",
            missingFields: {
              phone: !formData?.phone,
              email: !formData?.email,
              streetAddress: !formData?.streetAddress,
              city: !formData?.city,
            },
          },
          { status: 400 }
        );
      }
    }

    const agency = await Agency.findById(link.agencyId);
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const applicationNumber = generateApplicationNumber();

    const clientContact = {
      name: formData.companyName || formData.applicantName || "Unknown",
      phone: formData.phone?.trim() || "000-000-0000",
      email: formData.email?.trim() || "unknown@example.com",
      businessAddress: {
        street: formData.streetAddress?.trim() || formData.applicantMailingAddress || "Unknown Street",
        city: formData.city?.trim() || "Unknown City",
        state: formData.state || "CA",
        zip: formData.zip || "00000",
      },
    };

    let normalizedPayload = normalizeSubcontractors(formData);
    normalizedPayload = normalizeAdditionalCoverages(normalizedPayload);
    normalizedPayload.yearsExperienceInTrades = Number(formData.yearsOfExperienceTrade || 0);

    // Create submission (application)
    const submission = await Submission.create({
      applicationNumber,
      agencyId: link.agencyId,
      agentName: link.agentName,
      templateId: null,
      payload: normalizedPayload,
      files: [],
      status: "SUBMITTED",
      clientContact,
      ccpaConsent: true,
      state: formData.state || "CA",
      programId,
      programName: programName || "Advantage Contractor GL",
      carrierEmail: carrierEmail || process.env.DEFAULT_CARRIER_EMAIL || "carrier@example.com",
      submittedToCarrierAt: new Date(),
    });

    // Mark link as used
    link.used = true;
    await link.save();

    await logActivity(
      createActivityLogData(
        "SUBMISSION_CREATED",
        `Application submitted via public link for agent ${link.agentName}`,
        {
          submissionId: submission._id.toString(),
          user: {
            id: "PUBLIC_USER",
            name: "Public Link User",
            email: "public@sterling.com",
            role: "public",
          },
          details: {
            applicationNumber,
            programName,
            agencyId: link.agencyId,
            clientName: formData.companyName || formData.applicantName || "Unknown",
          },
        }
      )
    );

    // Generate Application PDF and send to carrier
    let pdfUrl = "";
    let pdfBuffer: Buffer | undefined;

    try {
      const capitalCoLogoSVG = await loadCapitalCoLogo();
      let htmlContent: string = "";

      const isApartment = programId === "apartment-buildings" || 
                          programName?.toLowerCase().includes("apartment building") || 
                          programName?.toLowerCase().includes("commercial property");

      const isContractors = programId === "contractors-equipment" || 
                           programName?.toLowerCase().includes("contractors equipment");

      const isManufacturers = programId === "manufacturers" ||
                             programName?.toLowerCase().includes("manufacturer");

      if (isApartment) {
        const apartmentData = mapApartmentDataToPacketData(
          submission.payload,
          submission.submissionNumber?.toString() || applicationNumber,
          agency,
          undefined,
          submission,
          capitalCoLogoSVG
        );
        htmlContent = generateApartmentPacketHTML(apartmentData);
      } else if (isContractors) {
        const contractorsData = mapContractorsDataToPacketData(
          submission.payload,
          submission._id.toString(),
          agency,
          "Capital & Co",
          submission,
          capitalCoLogoSVG
        );
        htmlContent = generateContractorsPacketHTML(contractorsData);
      } else if (isManufacturers) {
        htmlContent = generateManufacturersPacketHTML(submission.payload);
      } else {
        let packetData = mapFormDataToPacketData(
          submission.payload,
          submission._id.toString(),
          agency,
          undefined,
          submission,
          capitalCoLogoSVG
        );
        htmlContent = await generateApplicationPacketHTML(packetData);
      }

      const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
      pdfBuffer = await generatePDFFromHTML({
        html: htmlContent,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      if (pdfBuffer) {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
          await submission.save();
        } else {
          const fileName = `application-${submission._id.toString()}.pdf`;
          pdfUrl = await savePDFToStorage(pdfBuffer, fileName);
          submission.applicationPdfUrl = pdfUrl;
          await submission.save();
        }
      }
    } catch (pdfError: any) {
      console.error("❌ PDF generation error (non-fatal):", pdfError);
    }

    return NextResponse.json({
      success: true,
      application: {
        id: submission._id.toString(),
        applicationNumber,
        status: submission.status,
        submittedAt: submission.createdAt,
        pdfUrl: pdfUrl || null,
        pdfGenerated: !!pdfBuffer,
      },
    });
  } catch (error: any) {
    console.error("Public application submit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}