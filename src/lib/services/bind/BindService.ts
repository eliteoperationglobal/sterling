import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import Carrier from "@/models/Carrier";
import Agency from "@/models/Agency";
import { sendBindRequestToCarrier } from "@/lib/services/email/EmailService";
import { getDisplayProgramName } from "@/utils/formatters";

export interface IRequestBindResult {
  success: boolean;
  message: string;
  bindRequestedAt: Date;
  submissionId: string;
  status: string;
}

export class BindService {
  /**
   * Request bind for a submission
   * Validates all requirements and updates submission/quote status
   */
  static async requestBind(submissionId: string): Promise<IRequestBindResult> {
    try {
      console.log("🔒 [BIND SERVICE] ========================================");
      console.log("🔒 [BIND SERVICE] BIND REQUEST REQUESTED");
      console.log(`🔒 [BIND SERVICE] Submission ID: ${submissionId}`);
      console.log("🔒 [BIND SERVICE] ========================================");

      // Fetch submission
      const submission = await Submission.findById(submissionId);

      if (!submission) {
        console.log("🔒 [BIND SERVICE] ❌ Submission not found");
        throw new Error("Submission not found");
      }

      console.log(`🔒 [BIND SERVICE] ✅ Submission found: ${submission._id}`);

      // Find the quote for this submission
      const quote = await Quote.findOne({ submissionId: submission._id });

      if (!quote) {
        console.log("🔒 [BIND SERVICE] ❌ Quote not found");
        throw new Error("Quote not found for this submission");
      }

      console.log(`🔒 [BIND SERVICE] ✅ Quote found: ${quote._id}`);
      console.log(`🔒 [BIND SERVICE] Current quote status: ${quote.status}`);

      // ✅ CRITICAL: Validate requirements for bind request
      // Rule 1: Quote must be APPROVED
      if (quote.status !== "APPROVED") {
        console.log(`🔒 [BIND SERVICE] ❌ Quote status is not APPROVED: ${quote.status}`);
        throw new Error("Quote must be approved before requesting bind");
      }

      // Rule 2 & 3: E-Signature AND Payment must be completed (strict validation)
      if (!submission.esignCompleted || submission.paymentStatus !== "PAID") {
        console.log("🔒 [BIND SERVICE] ❌ E-Signature or Payment not completed");
        console.log(`   E-Signature: ${submission.esignCompleted}`);
        console.log(`   Payment Status: ${submission.paymentStatus}`);
        throw new Error("E‑Signature and Payment must be completed before requesting bind.");
      }

      console.log("🔒 [BIND SERVICE] ✅ E-Signature completed");
      console.log("🔒 [BIND SERVICE] ✅ Payment completed");

      // Prevent duplicate requests
      if (submission.bindRequested) {
        console.log("🔒 [BIND SERVICE] ❌ Bind already requested");
        throw new Error("Bind request has already been submitted for this submission");
      }

      // Update submission with bind request
      submission.status = "BIND_REQUESTED";
      submission.bindRequested = true;
      submission.bindRequestedAt = new Date();
      submission.bindStatus = "REQUESTED";
      // Note: bindApproved remains false until admin approves
      await submission.save();

      console.log(`🔒 [BIND SERVICE] ✅ Submission updated - Status: BIND_REQUESTED`);

      // Update quote status to BIND_REQUESTED
      quote.status = "BIND_REQUESTED";
      await quote.save();

      console.log(`🔒 [BIND SERVICE] ✅ Quote updated - Status: BIND_REQUESTED`);

      // Fetch Carrier and Agency for email
      const carrier = await Carrier.findById(quote.carrierId).lean();
      const agency = await Agency.findById(submission.agencyId).lean();

      if (!carrier || !agency) {
        console.log("🔒 [BIND SERVICE] ⚠️ Carrier or Agency not found - skipping email");
      } else {
        // Get signed document URLs
        const proposalDoc = submission.signedDocuments?.find(d => d.documentType === "PROPOSAL" && d.signatureStatus === "SIGNED");
        const carrierFormsDoc = submission.signedDocuments?.find(d => d.documentType === "CARRIER_FORM" && d.signatureStatus === "SIGNED");

        // Send email to carrier underwriter
        console.log("🔒 [BIND SERVICE] 📧 Sending bind request email to carrier...");
        const emailSent = await sendBindRequestToCarrier({
          carrierEmail: carrier.email,
          carrierName: carrier.name,
          clientName: submission.clientContact.name,
          clientEmail: submission.clientContact.email,
          agencyName: agency.name,
          quoteNumber: quote._id.toString(),
          effectiveDate: quote.effectiveDate ? new Date(quote.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : undefined,
          finalAmount: quote.finalAmountUSD,
          programName: getDisplayProgramName(submission.programName),
          submissionId: submission._id.toString(),
          signedProposalUrl: proposalDoc?.documentUrl,
          signedCarrierFormsUrl: carrierFormsDoc?.documentUrl,
          applicationPdfUrl: submission.applicationPdfUrl,
        });

        if (emailSent) {
          console.log("🔒 [BIND SERVICE] ✅ Email sent successfully to carrier underwriter");
        } else {
          console.log("🔒 [BIND SERVICE] ⚠️ Email sending failed (mock mode - this is expected)");
        }
      }

      console.log("🔒 [BIND SERVICE] ========================================");
      console.log(`🔒 [BIND SERVICE] ✅ Bind request submitted successfully`);
      console.log(`🔒 [BIND SERVICE] Submission status: BIND_REQUESTED`);
      console.log(`🔒 [BIND SERVICE] Quote status: BIND_REQUESTED`);
      console.log(`🔒 [BIND SERVICE] Bind requested at: ${submission.bindRequestedAt}`);
      console.log("🔒 [BIND SERVICE] ========================================");

      return {
        success: true,
        message: "Bind request submitted successfully",
        submissionId: submission._id.toString(),
        status: "BIND_REQUESTED",
        bindRequestedAt: submission.bindRequestedAt,
      };
    } catch (error: any) {
      console.error("🔒 [BIND SERVICE] ❌ Bind request error:", error);
      throw error;
    }
  }
}

