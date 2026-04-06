import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import FinancePlan from "@/models/FinancePlan";

interface ISendForSignatureResult {
  success: boolean;
  signingUrl?: string;
  envelopeId?: string;
  documentsSent: number;
  error?: string;
}

interface IWebhookPayload {
  submissionId: string;
  documentType?: "PROPOSAL" | "FINANCE_AGREEMENT" | "CARRIER_FORM";
  envelopeId?: string;
  status?: "SIGNED" | "DECLINED";
}

interface IHandleWebhookResult {
  success: boolean;
  allSigned: boolean;
  esignCompleted: boolean;
  error?: string;
}

export class ESignService {
  /**
   * Send documents for e-signature (MOCK MODE)
   * Marks all documents as SENT and returns mock signing URL
   */
  static async sendForSignature(
    submissionId: string
  ): Promise<ISendForSignatureResult> {
    try {
      console.log("📝 [E-SIGN] ========================================");
      console.log("📝 [E-SIGN] SEND FOR SIGNATURE REQUEST");
      console.log(`📝 [E-SIGN] Submission ID: ${submissionId}`);
      console.log("📝 [E-SIGN] ========================================");

      // Ensure models are registered
      await import("@/models/Quote");
      await import("@/models/FinancePlan");

      // Get submission with documents
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        console.log("📝 [E-SIGN] ❌ Submission not found");
        return {
          success: false,
          documentsSent: 0,
          error: "Submission not found",
        };
      }

      console.log(`📝 [E-SIGN] ✅ Submission found: ${submission._id}`);

      // Get quote to check if approved
      const quote = await Quote.findOne({ submissionId }).lean();
      if (!quote) {
        return {
          success: false,
          documentsSent: 0,
          error: "Quote not found for this submission",
        };
      }

      if (quote.status !== "APPROVED") {
        return {
          success: false,
          documentsSent: 0,
          error: "Quote must be approved before sending for signature",
        };
      }

      // Check if documents exist
      if (!submission.signedDocuments || submission.signedDocuments.length === 0) {
        console.log("📝 [E-SIGN] ❌ No documents found in submission");
        return {
          success: false,
          documentsSent: 0,
          error: "No documents found. Please generate documents first.",
        };
      }

      console.log(`📝 [E-SIGN] Found ${submission.signedDocuments.length} documents`);

      // Log all document statuses for debugging
      submission.signedDocuments.forEach((doc: any, idx: number) => {
        console.log(`📝 [E-SIGN] Document ${idx + 1}: ${doc.documentType} - Status: ${doc.signatureStatus || "UNDEFINED"}`);
      });

      // Fix documents that don't have a valid status
      // Allow sending documents that are GENERATED or SENT (but not SIGNED)
      let documentsUpdated = false;
      submission.signedDocuments.forEach((doc: any) => {
        const currentStatus = doc.signatureStatus;
        // If document has no status, undefined, null, or empty string, set to GENERATED
        if (!currentStatus || currentStatus === "" || currentStatus === "undefined") {
          console.log(`📝 [E-SIGN] ⚠️ Fixing document ${doc.documentType}: ${currentStatus || "UNDEFINED"} → GENERATED`);
          doc.signatureStatus = "GENERATED";
          documentsUpdated = true;
        } else if (currentStatus !== "GENERATED" && currentStatus !== "SENT" && currentStatus !== "SIGNED" && currentStatus !== "DECLINED") {
          // If status is invalid, set to GENERATED
          console.log(`📝 [E-SIGN] ⚠️ Fixing invalid document status ${doc.documentType}: ${currentStatus} → GENERATED`);
          doc.signatureStatus = "GENERATED";
          documentsUpdated = true;
        } else if (currentStatus === "SENT" && !doc.signedAt) {
          // If document is SENT but not signed yet, reset to GENERATED to allow re-sending
          console.log(`📝 [E-SIGN] ⚠️ Resetting SENT document ${doc.documentType} to GENERATED (not signed yet)`);
          doc.signatureStatus = "GENERATED";
          doc.sentForSignatureAt = undefined;
          doc.esignEnvelopeId = undefined;
          documentsUpdated = true;
        }
      });

      if (documentsUpdated) {
        console.log("📝 [E-SIGN] ⚠️ Updated document statuses, saving submission...");
        submission.markModified("signedDocuments");
        await submission.save();
      }

      // Validate all documents are ready for sending (GENERATED status, not SIGNED)
      const invalidDocuments = submission.signedDocuments.filter(
        (doc: any) => {
          const status = doc.signatureStatus;
          // Reject if SIGNED or DECLINED (already processed)
          if (status === "SIGNED" || status === "DECLINED") {
            return true;
          }
          // Reject if not GENERATED (should have been fixed above)
          if (status !== "GENERATED") {
            return true;
          }
          return false;
        }
      );
      
      if (invalidDocuments.length > 0) {
        console.log(`📝 [E-SIGN] ❌ Found ${invalidDocuments.length} documents that cannot be sent`);
        invalidDocuments.forEach((doc: any) => {
          console.log(`📝 [E-SIGN]   - ${doc.documentType}: ${doc.signatureStatus}${doc.signedAt ? " (already signed)" : ""}`);
        });
        return {
          success: false,
          documentsSent: 0,
          error: `Some documents cannot be sent. Documents with status "SIGNED" or "DECLINED" cannot be re-sent.`,
        };
      }

      console.log("📝 [E-SIGN] ✅ All documents are ready for signature (GENERATED status)");

      // Check required documents
      const hasProposal = submission.signedDocuments.some(
        (doc) => doc.documentType === "PROPOSAL" && doc.signatureStatus === "GENERATED"
      );
      const hasCarrierForms = submission.signedDocuments.some(
        (doc) => doc.documentType === "CARRIER_FORM" && doc.signatureStatus === "GENERATED"
      );

      console.log(`📝 [E-SIGN] Proposal found: ${hasProposal}`);
      console.log(`📝 [E-SIGN] Carrier Forms found: ${hasCarrierForms}`);

      // Check if finance agreement is needed
      const financePlan = await FinancePlan.findOne({
        quoteId: quote._id,
      }).lean();
      const needsFinanceAgreement = !!financePlan;

      if (needsFinanceAgreement) {
        const hasFinanceAgreement = submission.signedDocuments.some(
          (doc) => doc.documentType === "FINANCE_AGREEMENT"
        );
        if (!hasFinanceAgreement) {
          return {
            success: false,
            documentsSent: 0,
            error: "Finance agreement document required but not found. Please generate it first.",
          };
        }
      }

      if (!hasProposal) {
        return {
          success: false,
          documentsSent: 0,
          error: "Proposal document required but not found. Please generate it first.",
        };
      }

      if (!hasCarrierForms) {
        return {
          success: false,
          documentsSent: 0,
          error: "Carrier forms document required but not found. Please generate it first.",
        };
      }

      // Get insured/client email from submission
      const insuredEmail = submission.clientContact?.email;
      const insuredName = submission.clientContact?.name || "Insured";

      if (!insuredEmail) {
        console.log("📝 [E-SIGN] ❌ No email found for insured/client");
        return {
          success: false,
          documentsSent: 0,
          error: "Insured email address not found. Cannot send documents for signature.",
        };
      }

      // Generate mock envelope ID
      const envelopeId = `MOCK-ENV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Update all documents to SENT status
      let documentsSent = 0;
      submission.signedDocuments.forEach((doc) => {
        if (doc.signatureStatus === "GENERATED") {
          doc.signatureStatus = "SENT";
          doc.sentForSignatureAt = new Date();
          doc.esignEnvelopeId = envelopeId;
          documentsSent++;
        }
      });

      await submission.save();

      // Generate mock signing URL (relative frontend route)
      // In production, this would be a secure link from the e-signature provider (DocuSign, HelloSign, etc.)
      const signingUrl = `/agency/esign/sign?submissionId=${submissionId}&envelopeId=${envelopeId}`;

      // TODO: In production, integrate with e-signature provider (DocuSign, HelloSign, etc.)
      // The provider will:
      // 1. Send an email to insuredEmail with a secure signing link
      // 2. The insured clicks the link and signs the documents
      // 3. The provider sends a webhook when signing is complete
      // 4. We update the document status to "SIGNED" via the webhook handler

      // MOCK: Log email notification (in production, this would be sent via e-signature provider)
      console.log("📝 [E-SIGN] ========================================");
      console.log(`📝 [E-SIGN] ✅ Documents sent for e-signature: ${documentsSent} documents`);
      console.log(`📝 [E-SIGN] 📧 Email would be sent to: ${insuredEmail} (${insuredName})`);
      console.log(`📝 [E-SIGN] Envelope ID: ${envelopeId}`);
      console.log(`📝 [E-SIGN] Mock Signing URL: ${signingUrl}`);
      console.log(`📝 [E-SIGN] ⚠️  MOCK MODE: No actual email sent. In production, e-signature provider will send email.`);
      console.log("📝 [E-SIGN] ========================================");

      return {
        success: true,
        signingUrl,
        envelopeId,
        documentsSent,
      };
    } catch (error: any) {
      console.error("Send for signature error:", error);
      return {
        success: false,
        documentsSent: 0,
        error: error.message || "Failed to send documents for signature",
      };
    }
  }

  /**
   * Handle e-signature webhook (MOCK MODE)
   * Updates document signature status and checks if all are signed
   */
  static async handleWebhook(
    payload: IWebhookPayload
  ): Promise<IHandleWebhookResult> {
    try {
      const { submissionId, documentType, status = "SIGNED" } = payload;

      if (!submissionId) {
        return {
          success: false,
          allSigned: false,
          esignCompleted: false,
          error: "submissionId is required",
        };
      }

      // Get submission
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return {
          success: false,
          allSigned: false,
          esignCompleted: false,
          error: "Submission not found",
        };
      }

      // Update specific document or all documents
      if (documentType) {
        // Update specific document
        const doc = submission.signedDocuments.find(
          (d) => d.documentType === documentType
        );
        if (doc) {
          doc.signatureStatus = status;
          if (status === "SIGNED") {
            doc.signedAt = new Date();
          }
        } else {
          return {
            success: false,
            allSigned: false,
            esignCompleted: false,
            error: `Document type ${documentType} not found`,
          };
        }
      } else {
        // Update all documents (for mock mode - mark all as signed)
        submission.signedDocuments.forEach((doc) => {
          if (doc.signatureStatus === "SENT") {
            doc.signatureStatus = status;
            if (status === "SIGNED") {
              doc.signedAt = new Date();
            }
          }
        });
      }

      // Check if all required documents are signed
      const allSigned = submission.signedDocuments.every(
        (doc) => doc.signatureStatus === "SIGNED"
      );

      // Update esignCompleted if all documents are signed
      if (allSigned && !submission.esignCompleted) {
        submission.esignCompleted = true;
        submission.esignCompletedAt = new Date();
        console.log(`✅ All documents signed for submission ${submissionId}`);
        console.log(`   E-signature completed at: ${submission.esignCompletedAt}`);
      }

      await submission.save();

      return {
        success: true,
        allSigned,
        esignCompleted: submission.esignCompleted || false,
      };
    } catch (error: any) {
      console.error("Handle webhook error:", error);
      return {
        success: false,
        allSigned: false,
        esignCompleted: false,
        error: error.message || "Failed to handle webhook",
      };
    }
  }

  /**
   * Check e-signature status for a submission
   */
  static async checkStatus(submissionId: string) {
    try {
      const submission = await Submission.findById(submissionId)
        .select("signedDocuments esignCompleted esignCompletedAt")
        .lean();

      if (!submission) {
        return null;
      }

      const documents = submission.signedDocuments || [];
      const allSigned = documents.every(
        (doc) => doc.signatureStatus === "SIGNED"
      );

      return {
        documents: documents.map((doc) => ({
          documentType: doc.documentType,
          documentName: doc.documentName,
          signatureStatus: doc.signatureStatus,
          signedAt: doc.signedAt,
        })),
        allSigned,
        esignCompleted: submission.esignCompleted || false,
        esignCompletedAt: submission.esignCompletedAt,
      };
    } catch (error: any) {
      console.error("Check e-sign status error:", error);
      return null;
    }
  }
}

export default ESignService;

