import mongoose, { Schema, models, model } from "mongoose";

const BoundPolicySchema = new Schema(
  {
    submissionId: String,
    status: String,
  },
  { timestamps: true }
);

// ⭐ MOST IMPORTANT
const BoundPolicy =
  models.BoundPolicy || model("BoundPolicy", BoundPolicySchema);

export default BoundPolicy;