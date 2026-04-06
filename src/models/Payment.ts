import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = 
  | "PENDING"      // Payment initiated, awaiting completion
  | "PROCESSING"   // Payment being processed
  | "COMPLETED"    // Payment successful
  | "FAILED"       // Payment failed
  | "REFUNDED"     // Payment refunded
  | "CANCELLED";   // Payment cancelled

export type PaymentType = 
  | "FULL"         // Pay in full
  | "DOWN_PAYMENT" // Down payment for finance
  | "INSTALLMENT"; // EMI installment

export type PaymentMethod = 
  | "STRIPE"
  | "MOCK"
  | "BANK_TRANSFER"
  | "CHECK"
  | "WIRE";

export interface IPayment extends Document {
  quoteId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  financePlanId?: mongoose.Types.ObjectId; // If paying with finance
  
  // Payment details
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  amountUSD: number;
  status: PaymentStatus;
  
  // Payment provider details
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  transactionId?: string; // Generic transaction reference
  
  // Metadata
  paidBy: mongoose.Types.ObjectId; // User who made payment
  paidAt?: Date;
  failureReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
      index: true,
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    financePlanId: {
      type: Schema.Types.ObjectId,
      ref: "FinancePlan",
    },
    paymentType: {
      type: String,
      enum: ["FULL", "DOWN_PAYMENT", "INSTALLMENT"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["STRIPE", "MOCK", "BANK_TRANSFER", "CHECK", "WIRE"],
      required: true,
      default: "MOCK",
    },
    amountUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"],
      required: true,
      default: "PENDING",
      index: true,
    },
    // Stripe-specific fields
    stripePaymentIntentId: {
      type: String,
    },
    stripeClientSecret: {
      type: String,
    },
    // Generic transaction reference
    transactionId: {
      type: String,
      sparse: true,
    },
    // Metadata
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ quoteId: 1, status: 1 });
PaymentSchema.index({ agencyId: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

// Delete model from cache if it exists (for development)
if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

const Payment: Model<IPayment> = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;



