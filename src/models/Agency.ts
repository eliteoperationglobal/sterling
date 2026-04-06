import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgency extends Document {
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  allowedStates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true, default: "CA" },
      zip: { type: String, required: true },
    },
    phone: {
      type: String,
      required: true,
    },
    allowedStates: {
      type: [String],
      default: ["CA"],
    },
  },
  {
    timestamps: true,
  }
);

const Agency: Model<IAgency> =
  mongoose.models.Agency || mongoose.model<IAgency>("Agency", AgencySchema);

export default Agency;
