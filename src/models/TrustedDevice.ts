import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrustedDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  userAgent?: string;
  ip?: string;
  lastUsedAt: Date;
  createdAt: Date;
}

const TrustedDeviceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique index to prevent duplicate trusts for the same device+user
TrustedDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const TrustedDevice: Model<ITrustedDevice> =
  mongoose.models.TrustedDevice || mongoose.model<ITrustedDevice>("TrustedDevice", TrustedDeviceSchema);

export default TrustedDevice;
