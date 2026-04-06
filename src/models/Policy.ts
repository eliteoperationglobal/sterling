import mongoose, { Schema, Document, Model } from "mongoose";

export type PolicyStatus = "BOUND" | "ISSUED";

export interface IPolicy extends Document {
  submissionId: mongoose.Types.ObjectId;
  policyNumber: string;
  carrierId: mongoose.Types.ObjectId;
  issuedDate: Date;
  fileUrl: string;
  status: PolicyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema: Schema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      unique: true,
      index: true,
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
    },
    issuedDate: {
      type: Date,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["BOUND", "ISSUED"],
      default: "BOUND",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Policy: Model<IPolicy> =
  mongoose.models.Policy || mongoose.model<IPolicy>("Policy", PolicySchema);

export default Policy;
