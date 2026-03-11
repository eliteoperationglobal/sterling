import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Carrier from "@/models/Carrier";
import Agency from "@/models/Agency";
import { generateBinderHTML } from "@/lib/services/pdf/BinderPDF";
import { savePDFToStorage } from "@/lib/services/pdf/storage";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/admin/quotes/[id]/enter
 * Admin enters a quote for a submission (from carrier's external response)
 * [id] represents the submissionId
 * Body: { carrierId, carrierQuoteUSD, basePremium?, fees?, taxes?, effectiveDate?, expirationDate?, carrierReference? }
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

    // Only system_admin can access admin APIs
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const submissionId = params.id; // In this endpoint, [id] represents submissionId
    const body = await req.json();
    const {
      carrierId,
      carrierQuoteUSD,
      carrierFeesUSD,
      sterlingInsuranceServicesFeesUSD,
      premiumTaxPercent,
      premiumTaxAmountUSD,
      policyFeeUSD,
      stampingFeePercent,
      stampingFeeAmountUSD,
      fireMarshalTaxPercent,
      fireMarshalTaxAmountUSD,
      brokerFeeAmountUSD,
      limits,
      endorsements,
      effectiveDate,
      expirationDate,
      policyNumber,
      carrierReference,
      specialNotes
    } = body;

    // Validate input
    if (!carrierId || !carrierQuoteUSD) {
      return NextResponse.json(
        { error: "Missing required fields: carrierId, carrierQuoteUSD" },
        { status: 400 }
      );
    }

    if (carrierQuoteUSD <= 0) {
      return NextResponse.json(
        { error: "carrierQuoteUSD must be greater than 0" },
        { status: 400 }
      );
    }

    // Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get carrier
    const carrier = await Carrier.findById(carrierId);
    if (!carrier) {
      return NextResponse.json(
        { error: "Carrier not found" },
        { status: 404 }
      );
    }

    // Check if quote already exists for this submission and carrier.
    // If it does, we'll UPDATE it instead of blocking – this powers the
    // "Re-enter Quote" flow in the admin UI.
    const existingQuote = await Quote.findOne({
      submissionId,
      carrierId,
    });

    // Calculate final amount (no wholesale fee - removed per user request)
    const brokerFee = parseFloat(brokerFeeAmountUSD) || 0;
    const carrierFees = parseFloat(carrierFeesUSD) || 0;
    const sterlingFees = parseFloat(sterlingInsuranceServicesFeesUSD) || 0;
    const stampingAmount = parseFloat(stampingFeeAmountUSD) || 0;
    const taxAmount = parseFloat(premiumTaxAmountUSD) || 0;
    const policyFee = parseFloat(policyFeeUSD) || 0;
    const fireMarshalAmount = parseFloat(fireMarshalTaxAmountUSD) || 0;
    const finalAmountUSD =
      carrierQuoteUSD +
      carrierFees +
      sterlingFees +
      brokerFee +
      taxAmount +
      stampingAmount +   // ✅ ADD THIS
      fireMarshalAmount +
      policyFee;


    // ===============================
    // TOTAL TO RETAIN (10% of Final)
    // ===============================

    const totalToRetainUSD = carrierQuoteUSD * 0.10;

    // ===============================
    // TOTAL TO BE SENT (Agency Check)
    // ===============================

    console.log("Payment Option:", submission.paymentOption);
    console.log("Payload Payment Option:", submission.payload?.paymentOption);

    const paymentOption =
      submission?.paymentOption ||
      submission?.payload?.paymentOption;

    const totalToBeSentUSD =
      paymentOption == "Full Pay"
        ? Math.max(0, finalAmountUSD - totalToRetainUSD)
        : 0;

    // ===============================
    // DEPOSIT CALCULATION
    // ===============================

    const depositPremiumUSD = carrierQuoteUSD * 0.25;
    const depositCarrierFeesUSD = carrierFees; // 100%
    const depositTaxUSD = taxAmount * 0.25;
    const depositStampingUSD = stampingAmount * 0.25;
    const depositSterlingFeesUSD = sterlingFees; // 100%
    const depositFireMarshalUSD = fireMarshalAmount * 0.25;

    const totalDepositUSD =
      depositPremiumUSD +
      depositCarrierFeesUSD +
      depositTaxUSD +
      depositStampingUSD +
      depositSterlingFeesUSD +
      depositFireMarshalUSD;

    // ===============================
    // TOTAL TO BE SENT (finance Check)
    // ===============================

    const totalToFinanceCompanyUSD =
      paymentOption == "Premium Financial Partners Co."
        ? Math.max(0, totalDepositUSD - totalToRetainUSD)
        : 0;
    let quote;

    if (existingQuote) {
      // Re-enter / update existing quote
      existingQuote.carrierId = carrierId;
      existingQuote.carrierQuoteUSD = carrierQuoteUSD;
      existingQuote.carrierFeesUSD = carrierFees > 0 ? carrierFees : undefined;
      existingQuote.sterlingInsuranceServicesFeesUSD =
        sterlingFees > 0 ? sterlingFees : undefined;
      existingQuote.brokerFeeAmountUSD = brokerFee;
      existingQuote.premiumTaxPercent = premiumTaxPercent
        ? parseFloat(premiumTaxPercent)
        : undefined;
      existingQuote.premiumTaxAmountUSD =
        taxAmount > 0 ? taxAmount : undefined;
      existingQuote.policyFeeUSD = policyFee > 0 ? policyFee : undefined;
      existingQuote.stampingFeePercent = stampingFeePercent
        ? parseFloat(stampingFeePercent)
        : undefined;
      existingQuote.stampingFeeAmountUSD =
        stampingAmount > 0 ? stampingAmount : undefined;
      existingQuote.fireMarshalTaxPercent = fireMarshalTaxPercent
        ? parseFloat(fireMarshalTaxPercent)
        : undefined;
      existingQuote.fireMarshalTaxAmountUSD =
        fireMarshalAmount > 0 ? fireMarshalAmount : undefined;
      existingQuote.finalAmountUSD = finalAmountUSD;
      existingQuote.depositPremiumUSD = depositPremiumUSD;
      existingQuote.depositCarrierFeesUSD = depositCarrierFeesUSD;
      existingQuote.depositTaxUSD = depositTaxUSD;
      existingQuote.depositStampingUSD = depositStampingUSD;
      existingQuote.depositSterlingFeesUSD = depositSterlingFeesUSD;
      existingQuote.depositFireMarshalUSD = depositFireMarshalUSD;
      existingQuote.totalDepositUSD = totalDepositUSD;
      existingQuote.totalToRetainUSD = totalToRetainUSD;
      existingQuote.totalToBeSentUSD = totalToBeSentUSD;
      existingQuote.totalToFinanceCompanyUSD = totalToFinanceCompanyUSD;
      existingQuote.limits = limits || undefined;
      existingQuote.endorsements = endorsements || [];
      existingQuote.effectiveDate = effectiveDate
        ? new Date(effectiveDate)
        : existingQuote.effectiveDate;
      existingQuote.expirationDate = expirationDate
        ? new Date(expirationDate)
        : existingQuote.expirationDate;
      existingQuote.policyNumber = policyNumber || undefined;
      existingQuote.carrierReference = carrierReference || undefined;
      existingQuote.specialNotes = specialNotes || undefined;
      existingQuote.status = "POSTED";
      existingQuote.postedAt = new Date();

      quote = await existingQuote.save();
    } else {
      // First-time quote entry
      quote = await Quote.create({
        submissionId,
        carrierId,
        carrierQuoteUSD,
        // No wholesale fee - removed per user request
        carrierFeesUSD: carrierFees > 0 ? carrierFees : undefined,
        sterlingInsuranceServicesFeesUSD:
          sterlingFees > 0 ? sterlingFees : undefined,
        brokerFeeAmountUSD: brokerFee,
        premiumTaxPercent: premiumTaxPercent
          ? parseFloat(premiumTaxPercent)
          : undefined,
        premiumTaxAmountUSD: taxAmount > 0 ? taxAmount : undefined,
        policyFeeUSD: policyFee > 0 ? policyFee : undefined,
        stampingFeePercent: stampingFeePercent
          ? parseFloat(stampingFeePercent)
          : undefined,
        stampingFeeAmountUSD: stampingAmount > 0 ? stampingAmount : undefined,
        finalAmountUSD,
        fireMarshalTaxPercent: fireMarshalTaxPercent
          ? parseFloat(fireMarshalTaxPercent)
          : undefined,
        fireMarshalTaxAmountUSD:
          fireMarshalAmount > 0 ? fireMarshalAmount : undefined,
        depositPremiumUSD,
        depositCarrierFeesUSD,
        depositTaxUSD,
        depositStampingUSD,
        depositSterlingFeesUSD,
        depositFireMarshalUSD,
        totalDepositUSD,
        totalToRetainUSD,
        totalToBeSentUSD,
        totalToFinanceCompanyUSD,
        limits: limits || undefined,
        endorsements: endorsements || [],
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expirationDate: expirationDate
          ? new Date(expirationDate)
          : undefined,
        policyNumber: policyNumber || undefined,
        carrierReference: carrierReference || undefined,
        specialNotes: specialNotes || undefined,
        status: "POSTED", // Posted to broker
        enteredByAdminId: (session.user as any).id,
        enteredAt: new Date(),
        postedAt: new Date(),
      });
    }

    // Ensure submission status is QUOTED
    await Submission.findByIdAndUpdate(submissionId, {
      status: "QUOTED",
    });

    // Log activity: Quote created or updated
    await logActivity(
      createActivityLogData(
        existingQuote ? "QUOTE_UPDATED" : "QUOTE_CREATED",
        existingQuote
          ? `Quote updated and posted by admin for ${
              submission.clientContact?.name || "client"
            }`
          : `Quote created and posted by admin for ${
              submission.clientContact?.name || "client"
            }`,
        {
          submissionId: submissionId,
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name:
              (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            carrierName: carrier.name,
            carrierQuoteUSD: carrierQuoteUSD,
            carrierFeesUSD: carrierFees,
            sterlingInsuranceServicesFeesUSD: sterlingFees,
            finalAmountUSD: finalAmountUSD,
            status: "POSTED",
          },
        }
      )
    );

    // Get agency for binder and email
    const agency = await Agency.findById(submission.agencyId);
    const formData = submission.payload || {};

    // Generate Binder PDF
    let binderPdfUrl = "";
    try {
      console.log("📄 Generating Binder PDF...");
      const binderData = {
        quoteNumber: quote._id.toString().substring(0, 8).toUpperCase(),
        binderDate: new Date().toLocaleDateString(),
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
        agencyName: agency?.name || "Unknown Agency",
        agencyEmail: agency?.email,
        carrierName: carrier.name,
        carrierReference: carrierReference || undefined,
        policyNumber: policyNumber || undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString() : new Date().toLocaleDateString(),
        expirationDate: expirationDate ? new Date(expirationDate).toLocaleDateString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        programName: (submission as any).programName || "Advantage Contractor GL",
        carrierQuoteUSD,
        carrierFeesUSD: carrierFees > 0 ? carrierFees : undefined,
        sterlingInsuranceServicesFeesUSD: sterlingFees > 0 ? sterlingFees : undefined,
        // No wholesale fee - removed per user request
        premiumTaxPercent: premiumTaxPercent ? parseFloat(premiumTaxPercent) : undefined,
        premiumTaxAmountUSD: taxAmount > 0 ? taxAmount : undefined,
        policyFeeUSD: policyFee > 0 ? policyFee : undefined,
        brokerFeeAmountUSD: brokerFee > 0 ? brokerFee : undefined,
        finalAmountUSD,
        limits: limits || undefined,
        endorsements: endorsements || undefined,
        specialNotes: specialNotes || undefined,
      };

      const htmlContent = generateBinderHTML(binderData);

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
      const fileName = `binder-${quote._id.toString()}.pdf`;
      binderPdfUrl = await savePDFToStorage(pdfBuffer, fileName);

      // Update quote with binder URL
      await Quote.findByIdAndUpdate(quote._id, {
        binderPdfUrl,
      });

      // Log activity: Document generated
      await logActivity(
        createActivityLogData(
          "DOCUMENT_GENERATED",
          `Binder PDF generated for quote`,
          {
            submissionId: submissionId,
            quoteId: quote._id.toString(),
            user: {
              id: (session.user as any).id,
              name: (session.user as any).name || (session.user as any).email,
              email: (session.user as any).email,
              role: (session.user as any).role || "system_admin",
            },
            details: {
              documentType: "BINDER",
              documentUrl: binderPdfUrl,
            },
          }
        )
      );

      console.log(`✅ Binder PDF generated: ${binderPdfUrl}`);
    } catch (pdfError: any) {
      console.error("❌ Binder PDF generation error:", pdfError);
      // Continue even if PDF fails - we can regenerate later
    }

    // Send email to broker
    try {
      const { sendQuoteToBroker } = await import("@/lib/services/email/EmailService");

      await sendQuoteToBroker({
        brokerEmail: agency?.email || submission.clientContact?.email || "",
        brokerName: agency?.name || "Broker",
        companyName: formData.companyName || submission.clientContact?.name || "Unknown Company",
        quoteNumber: quote._id.toString().substring(0, 8).toUpperCase(),
        finalAmount: finalAmountUSD,
        effectiveDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString() : new Date().toLocaleDateString(),
        expirationDate: expirationDate ? new Date(expirationDate).toLocaleDateString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        carrierName: carrier.name,
        programName: (submission as any).programName || "Advantage Contractor GL",
        pdfBuffer: undefined, // We'll include the URL instead
        binderPdfUrl,
      });

      console.log(`✅ Quote email sent to broker: ${agency?.email}`);
    } catch (emailError: any) {
      console.error("❌ Email send error:", emailError);
      // Continue even if email fails - admin can manually send
    }

    // Populate for response
    const populatedQuote = await Quote.findById(quote._id)
      .populate("carrierId", "name email")
      .populate("submissionId", "clientContact")
      .lean();

    // Update with binder URL in response
    (populatedQuote as any).binderPdfUrl = binderPdfUrl;

    console.log(`✅ Quote entered by admin for submission ${submissionId}`);

    return NextResponse.json({
      success: true,
      quote: populatedQuote,
    });
  } catch (error: any) {
    console.error("Quote entry error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enter quote" },
      { status: 500 }
    );
  }
}



