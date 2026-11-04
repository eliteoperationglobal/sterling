import mongoose, { Schema, models, model } from "mongoose";

const BoundPolicySchema = new Schema(
  {
    submissionId: String,
    status: String,
    effectiveCancellationDate: Date,
  },
  { timestamps: true }
);

BoundPolicySchema.index({ submissionId: 1 });
BoundPolicySchema.index({ effectiveCancellationDate: 1, status: 1 });
BoundPolicySchema.index({ createdAt: -1 });

// ⭐ MOST IMPORTANT
const BoundPolicy =
  models.BoundPolicy || model("BoundPolicy", BoundPolicySchema);

export default BoundPolicy;
