import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGeneratedLink extends Document {
  jti: string;
  agencyId: mongoose.Types.ObjectId;
  agentName: string;
  agencyName: string;
  programId: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedLinkSchema: Schema = new Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    agencyName: {
      type: String,
      required: true,
    },
    programId: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete document when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

// Delete model from cache if it exists (to handle schema changes in development)
if (mongoose.models.GeneratedLink) {
  delete mongoose.models.GeneratedLink;
}

const GeneratedLink: Model<IGeneratedLink> = mongoose.model<IGeneratedLink>("GeneratedLink", GeneratedLinkSchema);

export default GeneratedLink;
