import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  otp: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete when expiresAt is reached
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for faster lookups
OTPSchema.index({ userId: 1, otp: 1 });

const OTP: Model<IOTP> =
  mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);

export default OTP;
