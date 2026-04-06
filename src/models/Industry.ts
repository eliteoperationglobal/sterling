import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIndustry extends Document {
  name: string;
  subtypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const IndustrySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subtypes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Industry: Model<IIndustry> =
  mongoose.models.Industry || mongoose.model<IIndustry>("Industry", IndustrySchema);

export default Industry;
