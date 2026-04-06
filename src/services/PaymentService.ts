/**
 * PaymentService
 * Handles payment processing, mock payments, and Stripe integration
 */

interface ICreatePaymentParams {
  quoteId: string;
  agencyId: string;
  userId: string;
  paymentType: "FULL" | "DOWN_PAYMENT" | "INSTALLMENT";
  amountUSD: number;
  paymentMethod?: "STRIPE" | "MOCK";
  financePlanId?: string;
}

interface IPaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  clientSecret?: string; // For Stripe
  error?: string;
}

export class PaymentService {
  /**
   * Create a payment (mock mode by default)
   */
  static async createPayment(params: ICreatePaymentParams): Promise<IPaymentResult> {
    const Payment = (await import("@/models/Payment")).default;
    
    const paymentMethod = params.paymentMethod || "MOCK";
    // Stripe disabled for build - using mock payments only

    try {
      // Create payment record
      const payment = await Payment.create({
        quoteId: params.quoteId,
        agencyId: params.agencyId,
        financePlanId: params.financePlanId || undefined,
        paymentType: params.paymentType,
        paymentMethod: paymentMethod,
        amountUSD: params.amountUSD,
        status: "PENDING",
        paidBy: params.userId,
      });

      // Stripe integration disabled - using mock payments only
      // To enable Stripe: install stripe package and uncomment the code below
      /*
      const useStripe = process.env.STRIPE_ENABLED === "true";
      if (useStripe) {
        try {
          const stripe = await this.getStripeClient();
          if (stripe) {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(params.amountUSD * 100),
              currency: "usd",
              metadata: {
                quoteId: params.quoteId,
                paymentId: payment._id.toString(),
                paymentType: params.paymentType,
              },
            });
            payment.stripePaymentIntentId = paymentIntent.id;
            payment.stripeClientSecret = paymentIntent.client_secret || undefined;
            payment.status = "PROCESSING";
            await payment.save();
            return {
              success: true,
              paymentId: payment._id.toString(),
              status: payment.status,
              clientSecret: paymentIntent.client_secret || undefined,
            };
          }
        } catch (stripeError: any) {
          console.error("Stripe error, falling back to mock:", stripeError.message);
        }
      }
      */

      // Mock payment - simulate instant success
      payment.status = "COMPLETED";
      payment.paidAt = new Date();
      payment.transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await payment.save();

      console.log(`✅ Mock payment completed: ${payment.transactionId}`);
      console.log(`   Type: ${params.paymentType}`);
      console.log(`   Amount: $${params.amountUSD.toFixed(2)}`);

      return {
        success: true,
        paymentId: payment._id.toString(),
        status: "COMPLETED",
      };
    } catch (error: any) {
      console.error("Payment creation error:", error);
      return {
        success: false,
        paymentId: "",
        status: "FAILED",
        error: error.message,
      };
    }
  }

  /**
   * Get Stripe client (if configured)
   * DISABLED FOR BUILD - Always returns null to use mock payments
   * To enable Stripe: install stripe package and uncomment code below
   */
  private static async getStripeClient() {
    // Stripe disabled for build - always use mock payments
    console.log("⚠️  Stripe disabled - using mock payments");
    return null;
    
    /* 
    // Stripe integration code - uncomment when stripe package is installed
    // const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    // const stripeEnabled = process.env.STRIPE_ENABLED === "true";
    // if (!stripeEnabled || !stripeSecretKey) {
    //   return null;
    // }
    // const stripeModule = await import("stripe").catch(() => null);
    // if (!stripeModule) return null;
    // const Stripe = stripeModule.default;
    // return new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });
    */
  }

  /**
   * Confirm payment (for Stripe webhook or manual confirmation)
   */
  static async confirmPayment(paymentId: string): Promise<boolean> {
    const Payment = (await import("@/models/Payment")).default;
    
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        console.error("Payment not found:", paymentId);
        return false;
      }

      payment.status = "COMPLETED";
      payment.paidAt = new Date();
      await payment.save();

      console.log(`✅ Payment confirmed: ${paymentId}`);
      return true;
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      return false;
    }
  }

  /**
   * Fail payment
   */
  static async failPayment(paymentId: string, reason: string): Promise<boolean> {
    const Payment = (await import("@/models/Payment")).default;
    
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return false;
      }

      payment.status = "FAILED";
      payment.failureReason = reason;
      await payment.save();

      console.log(`❌ Payment failed: ${paymentId} - ${reason}`);
      return true;
    } catch (error: any) {
      console.error("Payment failure update error:", error);
      return false;
    }
  }

  /**
   * Get payment history for a quote
   */
  static async getPaymentHistory(quoteId: string) {
    const Payment = (await import("@/models/Payment")).default;
    
    try {
      const payments = await Payment.find({ quoteId })
        .populate("paidBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return payments;
    } catch (error: any) {
      console.error("Payment history fetch error:", error);
      return [];
    }
  }

  /**
   * Check if quote is fully paid
   */
  static async isQuoteFullyPaid(quoteId: string): Promise<boolean> {
    const Payment = (await import("@/models/Payment")).default;
    
    try {
      const fullPayment = await Payment.findOne({
        quoteId,
        paymentType: "FULL",
        status: "COMPLETED",
      });

      return !!fullPayment;
    } catch (error) {
      return false;
    }
  }
}

export default PaymentService;



