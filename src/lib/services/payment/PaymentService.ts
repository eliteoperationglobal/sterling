import Submission from "@/models/Submission";
import connectDB from "@/lib/mongodb";

export interface ProcessPaymentParams {
  submissionId: string;
  amount: number;
  method: string;
}

export interface PaymentResult {
  success: boolean;
  paymentStatus: "PAID" | "FAILED";
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentStatus {
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paymentDate?: Date;
  paymentAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
}

/**
 * Payment Service
 * Handles payment processing and status checks
 */
export class PaymentService {
  /**
   * Process a payment for a submission
   * Validates e-signature completion before allowing payment
   */
  static async processPayment(
    params: ProcessPaymentParams
  ): Promise<PaymentResult> {
    try {
      await connectDB();

      const { submissionId, amount, method } = params;

      // Validate inputs
      if (!submissionId || !amount || !method) {
        return {
          success: false,
          paymentStatus: "FAILED",
          paymentDate: new Date(),
          paymentAmount: amount || 0,
          paymentMethod: method || "UNKNOWN",
          error: "Missing required payment parameters",
        };
      }

      if (amount <= 0) {
        return {
          success: false,
          paymentStatus: "FAILED",
          paymentDate: new Date(),
          paymentAmount: amount,
          paymentMethod: method,
          error: "Payment amount must be greater than 0",
        };
      }

      // Fetch submission
      const submission = await Submission.findById(submissionId);

      if (!submission) {
        return {
          success: false,
          paymentStatus: "FAILED",
          paymentDate: new Date(),
          paymentAmount: amount,
          paymentMethod: method,
          error: "Submission not found",
        };
      }

      // ✅ CRITICAL: Check if e-signature is completed
      // UI LOGIC NOTE: If !submission.esignCompleted, API returns error: "E-Sign required before payment"
      // Frontend should disable payment button and show message: "Complete E-Signature first"
      if (!submission.esignCompleted) {
        return {
          success: false,
          paymentStatus: "FAILED",
          paymentDate: new Date(),
          paymentAmount: amount,
          paymentMethod: method,
          error: "E-Signature must be completed before payment",
        };
      }

      // Mock payment processing (replace with real payment gateway integration)
      // For now, simulate a successful transaction
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update submission with payment information
      submission.paymentStatus = "PAID";
      submission.paymentDate = new Date();
      submission.paymentMethod = method;
      submission.paymentAmount = amount;

      await submission.save();

      console.log(`✅ Payment processed successfully`);
      console.log(`   Submission ID: ${submissionId}`);
      console.log(`   Amount: $${amount}`);
      console.log(`   Method: ${method}`);
      console.log(`   Transaction ID: ${transactionId}`);

      // UI LOGIC NOTE: When payment succeeds (paymentStatus = "PAID"), 
      // UI should unlock "Request Bind" button
      // Condition: submission.paymentStatus === "PAID" && submission.esignCompleted === true
      return {
        success: true,
        paymentStatus: "PAID",
        paymentDate: submission.paymentDate,
        paymentAmount: amount,
        paymentMethod: method,
        transactionId,
      };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return {
        success: false,
        paymentStatus: "FAILED",
        paymentDate: new Date(),
        paymentAmount: params.amount || 0,
        paymentMethod: params.method || "UNKNOWN",
        error: error.message || "Payment processing failed",
      };
    }
  }

  /**
   * Get payment status for a submission
   */
  static async getPaymentStatus(
    submissionId: string
  ): Promise<PaymentStatus | null> {
    try {
      await connectDB();

      const submission = await Submission.findById(submissionId).select(
        "paymentStatus paymentDate paymentMethod paymentAmount"
      );

      if (!submission) {
        return null;
      }

      return {
        paymentStatus: submission.paymentStatus || "PENDING",
        paymentDate: submission.paymentDate,
        paymentAmount: submission.paymentAmount,
        paymentMethod: submission.paymentMethod,
      };
    } catch (error: any) {
      console.error("Get payment status error:", error);
      throw error;
    }
  }
}

