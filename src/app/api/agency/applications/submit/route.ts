import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import { generateApplicationPacketHTML, mapFormDataToPacketData, loadCapitalCoLogo } from "@/lib/services/pdf/ApplicationPacketPDF";
import { generateApartmentPacketHTML } from "@/lib/services/pdf/ApartmentPacketPDF";
import { mapApartmentDataToPacketData } from "@/lib/services/pdf/mappers/apartmentMapper";
import { savePDFToStorage } from "@/lib/services/pdf/storage";
import { sendEmail } from "@/lib/services/email/EmailService";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";




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
  // Case 1: user does NOT use subcontractors
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

  // Case 2: user DOES use subcontractors
  if (formData?.useSubcontractors === true) {
    return {
      ...formData,
      subcontractors: {
        useSubcontractors: true,

        collectCertificates: formData.collectSubCertificates ?? false,
        collectCertificatesExplanation:
          formData.collectSubCertificatesExplanation || "",

        requireEqualLimits: formData.requireSubInsuranceEqual ?? false,
        requireEqualLimitsExplanation:
          formData.requireSubInsuranceEqualExplanation || "",

        requireAdditionalInsured: formData.requireAdditionalInsured ?? false,
        requireAdditionalInsuredExplanation:
          formData.requireAdditionalInsuredExplanation || "",

        haveWrittenContracts: formData.haveWrittenSubContracts ?? false,
        haveWrittenContractsExplanation:
          formData.haveWrittenSubContractsExplanation || "",

        requireWorkersComp: formData.requireWorkersComp ?? false,
        requireWorkersCompExplanation:
          formData.requireWorkersCompExplanation || "",
      },
    };
  }

  // Case 3: user hasn't answered yet
  return formData;
}


function normalizeAdditionalCoverages(formData: any) {
  return {
    ...formData,
    inlandMarineEquipment: formData.addInlandMarineEquipment ?? false,
    buildersRisk: formData.addBuildersRisk ?? false,
    environmentalCoverage: formData.addEnvironmentalCoverage ?? false,
  };
}



/**
 * POST /api/agency/applications/submit
 * Submit application (no premium calculation)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { programId, programName, formData, carrierEmail } = await req.json();




    // 🔒 Required client contact validation
    if (
      !formData?.phone ||
      !formData?.email ||
      !formData?.streetAddress ||
      !formData?.city
    ) {
      if (programId !== "apartment-buildings") {
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


    if (!programId || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get agency details
    const agency = await Agency.findById(user.agencyId);
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Generate application number
    const applicationNumber = generateApplicationNumber();

    // Prepare client contact from form data
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

    normalizedPayload.yearsExperienceInTrades =
      Number(formData.yearsOfExperienceTrade || 0);

    // Create submission (application)
    const submission = await Submission.create({
      applicationNumber,
      agencyId: user.agencyId,
      agentId: user.id || undefined,
      agentName: user.name || user.email || undefined,
      templateId: null,
      payload: normalizedPayload,
      files: [],
      status: "SUBMITTED",
      clientContact,
      ccpaConsent: true,
      state: formData.state || "CA",
      programId,
      programName: programName || "Advantage Contractor GL",
      carrierEmail:
        carrierEmail ||
        process.env.DEFAULT_CARRIER_EMAIL ||
        "carrier@example.com",
      submittedToCarrierAt: new Date(),
    });

    // Log creation for notifications (system admin should get this)
    await logActivity(
      createActivityLogData(
        "SUBMISSION_CREATED",
        `Application submitted by ${user.name || user.email}`,
        {
          submissionId: submission._id.toString(),
          user: {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role || "agency_admin",
          },
          details: {
            applicationNumber,
            programName,
            agencyId: user.agencyId,
            clientName: formData.companyName || formData.applicantName || "Unknown",
          },
        }
      )
    );

    // ✅ THIS IS CORRECT
    await sendEmail({
      to: "example@example.com", // Or you can use: submission.carrierEmail
      subject: "🔥 Application Submitted Successfully",
      html: `
    <h2>Application Submitted</h2>
    <p>Application #: ${applicationNumber}</p>
    <p>Company: ${formData.companyName || formData.applicantName || "Unknown"}</p>
  `,
      text: `Application ${applicationNumber} submitted successfully`,
    });



    // Generate Application PDF and send to carrier
    let pdfUrl = "";
    let pdfBuffer: Buffer | undefined;

    try {
      console.log("📄 Starting PDF generation...");

      // Load Capital & Co logo SVG
      const capitalCoLogoSVG = await loadCapitalCoLogo();

      let htmlContent: string = "";

      if (programId === "apartment-buildings") {
        console.log("📄 Generating Commercial Property PDF...");
        const apartmentData = mapApartmentDataToPacketData(
          submission.payload,
          submission.submissionNumber?.toString() || applicationNumber,
          agency,
          undefined,
          submission,
          capitalCoLogoSVG
        );
        htmlContent = generateApartmentPacketHTML(apartmentData);
      } else {
        // Map form data to packet data format (no quote yet for new submissions)
        let packetData;
        try {
          packetData = mapFormDataToPacketData(
            submission.payload,
            submission._id.toString(),
            agency,
            undefined,
            submission,
            capitalCoLogoSVG
          );

          console.log("✅ Form data mapped successfully");
        } catch (mapError: any) {
          console.error("❌ Error mapping form data:", mapError?.message);
          throw new Error(`Failed to map form data: ${mapError?.message}`);
        }

        console.log("📄 Generating 12-page application packet HTML...");
        try {
          htmlContent = await generateApplicationPacketHTML(packetData);
          console.log(`📄 HTML content length: ${htmlContent.length} characters`);
        } catch (htmlError: any) {
          console.error("❌ Error generating HTML:", htmlError?.message);
          throw new Error(`Failed to generate HTML: ${htmlError?.message}`);
        }
      }

        // Generate PDF using production service (PDFShift)
        console.log("📄 Generating PDF using PDFShift...");
        try {
          const { generatePDFFromHTML } = await import('@/lib/services/pdf/PDFService');
          pdfBuffer = await generatePDFFromHTML({
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
          console.log(`📄 PDF generated - Size: ${pdfBuffer.length} bytes`);
        } catch (pdfGenError: any) {
          console.error("❌ PDF generation failed:", pdfGenError?.message);
          // Don't throw - allow submission to continue without PDF
          throw pdfGenError; // Re-throw to be caught by outer catch
        }

        // Save PDF to storage (skip in serverless environments like Vercel)
        if (pdfBuffer) {
          try {
            // In Vercel/serverless, filesystem is read-only, so skip file storage
            // PDF can be regenerated on-demand from submission data
            if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
              console.log("⚠️ Skipping PDF file storage in serverless environment");
              console.log("📄 PDF can be regenerated on-demand from submission data");
              // Submission will succeed without PDF URL - PDF can be generated later
              await submission.save();
            } else {
              // Local development - save to filesystem
              const fileName = `application-${submission._id.toString()}.pdf`;
              console.log(`📄 Saving PDF to storage: ${fileName}`);
              pdfUrl = await savePDFToStorage(pdfBuffer, fileName);
              console.log(`📄 PDF saved successfully: ${pdfUrl}`);

              // Update submission with PDF URL
              submission.applicationPdfUrl = pdfUrl;
              await submission.save();
              console.log("✅ PDF generation and save completed successfully");
            }
          } catch (saveError: any) {
            console.error("❌ PDF save error (non-fatal):", saveError?.message);
            // Continue - PDF generation succeeded but save failed
            // In production/serverless, PDF can be regenerated on-demand
            console.log("⚠️ Submission will continue without PDF URL - can be regenerated later");
            // Save submission without PDF URL
            await submission.save().catch((saveErr) => {
              console.error("❌ Failed to save submission:", saveErr?.message);
              // This is non-fatal - submission was already created
            });
          }
        }
      } catch (pdfError: any) {
        console.error("❌ PDF generation error (non-fatal):", pdfError);
        console.error("❌ Error message:", pdfError?.message);
        console.error("❌ Error stack:", pdfError?.stack);
        // Continue even if PDF fails - submission should still succeed
        // PDF can be regenerated later from the submission data
        console.log("⚠️ Continuing submission without PDF - can be regenerated later");
    }

    // Send email to carrier with PDF attachment
    try {
      const { sendApplicationToCarrier } = await import("@/lib/services/email/EmailService");

      await sendApplicationToCarrier({
        carrierEmail: submission.carrierEmail || "",
        agencyName: agency.name || "Unknown Agency",
        companyName: formData.companyName || "Unknown Company",
        programName: programName || "Advantage Contractor GL",
        submittedDate: new Date().toLocaleDateString(),
        applicantEmail: formData.email || "",
        applicantPhone: formData.phone || "",
        pdfBuffer,
      });

      console.log(`✅ Application email sent to carrier: ${submission.carrierEmail}`);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Continue even if email fails - admin can manually send
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
    console.error("Application submit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agency/applications/submit?applicationId=xxx
 * Get application details
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const searchParams = req.nextUrl.searchParams;
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "Missing applicationId" },
        { status: 400 }
      );
    }

    await connectDB();

    const submission = await Submission.findOne({
      _id: applicationId,
      agencyId: user.agencyId,
    });

    if (!submission) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      application: {
        id: submission._id.toString(),
        programId: submission.programId,
        programName: submission.programName,
        status: submission.status,
        clientContact: submission.clientContact,
        formData: submission.payload,
        submittedAt: submission.createdAt,
        pdfUrl: submission.applicationPdfUrl,
      },
    });
  } catch (error: any) {
    console.error("Application fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch application" },
      { status: 500 }
    );
  }
}

