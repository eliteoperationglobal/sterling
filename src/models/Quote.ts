import mongoose, { Schema, Document, Model } from "mongoose";

export type QuoteStatus =
  | "ENTERED"
  | "POSTED"
  | "APPROVED"
  | "PAYMENT_RECEIVED"
  | "BIND_REQUESTED"
  | "BOUND";

export interface ILimits {
  generalLiability?: string; // e.g., "1M / 1M / 1M"
  aggregateLimit?: string;
  productsCompletedOps?: string;
  personalAdvertisingInjury?: string;
  fireLegalLimit?: string;
  medicalExpenseLimit?: string;
  deductible?: string;
  excessLimit?: string;
}

export interface IQuote extends Document {
  submissionId: mongoose.Types.ObjectId;
  carrierId: mongoose.Types.ObjectId;
  policyType?: 'GENERAL_LIABILITY' | 'EXCESS_LIABILITY'; // Which policy this quote belongs to

  // Premium breakdown
  carrierQuoteUSD: number;
  carrierFeesUSD?: number;
  sterlingInsuranceServicesFeesUSD?: number;
  stampingFeePercent?: number;
  stampingFeeAmountUSD?: number;
  wholesaleFeePercent?: number; // Optional - removed per user request
  wholesaleFeeAmountUSD?: number; // Optional - removed per user request
  brokerFeeAmountUSD: number;
  premiumTaxPercent?: number;
  premiumTaxAmountUSD?: number;
  policyFeeUSD?: number;
  finalAmountUSD: number;
  fireMarshalTaxPercent?: number;
  fireMarshalTaxAmountUSD?: number;
  fireMarshalFlatFeeUSD?: number;
  stampingFeePerFilingUSD?: number;
  slaServiceChargeUSD?: number;
  depositPremiumUSD?: number;
  depositCarrierFeesUSD?: number;
  depositTaxUSD?: number;
  depositStampingUSD?: number;
  depositSterlingFeesUSD?: number;
  depositFireMarshalUSD?: number;
  totalToBeSentUSD?: number;
  totalDepositUSD?: number;
  totalToRetainUSD?: number;
  totalToFinanceCompanyUSD?: number;

  // Policy details
  limits?: ILimits;
  endorsements?: string[]; // Array of endorsement names
  effectiveDate?: Date;
  expirationDate?: Date;
  policyNumber?: string;
  customDocuments?: string[]; // Array of custom document names/URLs
  checkedDocuments?: Map<string, boolean>; // Map of document IDs to their checked status
  specialNotes?: string;
  adminNotes?: string; // Internal notes visible to agencies

  // Documents
  binderPdfUrl?: string;
  binderUrl?: string;
  policyDocsUrl?: string;

  status: QuoteStatus;
  // Admin entry fields
  enteredByAdminId?: mongoose.Types.ObjectId;
  enteredAt?: Date;
  postedAt?: Date;
  carrierReference?: string; // Carrier quote number/reference
  // Agency approval fields
  approvedAt?: Date;
  approvedByUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedQuote extends Omit<IQuote, 'carrierId'> {
  carrierId: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
}

const LimitsSchema: Schema = new Schema({
  generalLiability: String,
  aggregateLimit: String,
  productsCompletedOps: String,
  personalAdvertisingInjury: String,
  fireLegalLimit: String,
  medicalExpenseLimit: String,
  deductible: String,
}, { _id: false });

const QuoteSchema: Schema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      index: true,
    },
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
    },
    policyType: {
      type: String,
      enum: ['GENERAL_LIABILITY', 'EXCESS_LIABILITY'],
      default: 'GENERAL_LIABILITY',
    },
    // Premium breakdown
    carrierQuoteUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    carrierFeesUSD: {
      type: Number,
      min: 0,
    },
    sterlingInsuranceServicesFeesUSD: {
      type: Number,
      min: 0,
    },
    stampingFeePercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    stampingFeeAmountUSD: {
      type: Number,
      min: 0,
    },
    fireMarshalTaxPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    fireMarshalTaxAmountUSD: {
      type: Number,
      min: 0,
    },
    fireMarshalFlatFeeUSD: {
      type: Number,
      min: 0,
    },
    stampingFeePerFilingUSD: {
      type: Number,
      min: 0,
    },

    slaServiceChargeUSD: {
      type: Number,
      min: 0,
    },
    depositPremiumUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositCarrierFeesUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositTaxUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositStampingUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositSterlingFeesUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositFireMarshalUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalDepositUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalToRetainUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalToBeSentUSD: {
      type: Number,
      min: 0,
    },
    totalToFinanceCompanyUSD: {
      type: Number,
      min: 0,
    },
    wholesaleFeePercent: {
      type: Number,
      required: false, // Optional - removed per user request
      min: 0,
      max: 100,
    },
    wholesaleFeeAmountUSD: {
      type: Number,
      required: false, // Optional - removed per user request
      min: 0,
    },
    brokerFeeAmountUSD: {
      type: Number,
      default: 0,
      min: 0,
    },
    premiumTaxPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    premiumTaxAmountUSD: {
      type: Number,
      min: 0,
    },
    policyFeeUSD: {
      type: Number,
      min: 0,
    },
    finalAmountUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    // Policy details
    limits: {
      type: LimitsSchema,
    },
    endorsements: {
      type: [String],
      default: [],
    },
    effectiveDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
    policyNumber: {
      type: String,
      trim: true,
    },
    customDocuments: {
      type: [String],
      default: [],
    },
    checkedDocuments: {
      type: Map,
      of: Boolean,
      default: {},
    },
    specialNotes: {
      type: String,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    // Documents
    binderPdfUrl: {
      type: String,
    },
    binderUrl: {
      type: String,
    },
    policyDocsUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["ENTERED", "POSTED", "APPROVED", "PAYMENT_RECEIVED", "BIND_REQUESTED", "BOUND"],
      default: "ENTERED",
      index: true,
    },
    // Admin entry fields
    enteredByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    enteredAt: {
      type: Date,
    },
    postedAt: {
      type: Date,
    },
    carrierReference: {
      type: String,
      trim: true,
    },
    // Agency approval fields
    approvedAt: {
      type: Date,
    },
    approvedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
QuoteSchema.index({ submissionId: 1, status: 1 });

// Delete model from cache if it exists (to handle schema changes in development)
if (mongoose.models.Quote) {
  delete mongoose.models.Quote;
}

const Quote: Model<IQuote> = mongoose.model<IQuote>("Quote", QuoteSchema);

export default Quote;