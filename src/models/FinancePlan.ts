import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFinancePlan extends Document {
  quoteId: mongoose.Types.ObjectId;
  downPaymentUSD: number;
  tenureMonths: number;
  annualInterestPercent: number;
  monthlyInstallmentUSD: number;
  totalPayableUSD: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinancePlanSchema: Schema = new Schema(
  {
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
      index: true,
    },
    downPaymentUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 60, // Max 5 years
    },
    annualInterestPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    monthlyInstallmentUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPayableUSD: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Note: quoteId index is already defined in the field definition above (index: true)

const FinancePlan: Model<IFinancePlan> =
  mongoose.models.FinancePlan ||
  mongoose.model<IFinancePlan>("FinancePlan", FinancePlanSchema);

export default FinancePlan;


