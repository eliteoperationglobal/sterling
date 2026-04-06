import mongoose, { Schema } from "mongoose";
import { getModel } from "@/lib/getModel";

const CancelRequestSchema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    status: {
      type: String,
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// ⭐ use helper
const CancelRequest = getModel("CancelRequest", CancelRequestSchema);

export default CancelRequest;