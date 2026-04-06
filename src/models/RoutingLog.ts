import mongoose, { Schema, Document, Model } from "mongoose";

export type RoutingLogStatus = "PENDING" | "SENT" | "FAILED" | "BOUNCED";

export interface IRoutingLog extends Document {
  submissionId: mongoose.Types.ObjectId;
  carrierId: mongoose.Types.ObjectId;
  status: RoutingLogStatus;
  notes?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoutingLogSchema: Schema = new Schema(
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
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "BOUNCED"],
      default: "PENDING",
      index: true,
    },
    notes: {
      type: String,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
RoutingLogSchema.index({ submissionId: 1, status: 1 });
RoutingLogSchema.index({ carrierId: 1, status: 1 });
RoutingLogSchema.index({ createdAt: -1 });

const RoutingLog: Model<IRoutingLog> =
  mongoose.models.RoutingLog ||
  mongoose.model<IRoutingLog>("RoutingLog", RoutingLogSchema);

export default RoutingLog;
