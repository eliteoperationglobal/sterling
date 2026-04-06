import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFormField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "date" | "file" | "textarea";
  required: boolean;
  options?: string[];
  conditional?: {
    field: string;
    value: any;
  };
  helpText?: string;
  placeholder?: string;
}

export interface IFormTemplate extends Document {
  industry: string;
  subtype: string;
  title: string;
  description: string;
  fields: IFormField[];
  country: string;
  stateSpecific: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema: Schema = new Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "number", "select", "boolean", "date", "file", "textarea"],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [String],
  conditional: {
    field: String,
    value: Schema.Types.Mixed,
  },
  helpText: String,
  placeholder: String,
});

const FormTemplateSchema: Schema = new Schema(
  {
    industry: {
      type: String,
      required: true,
      index: true,
    },
    subtype: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    fields: {
      type: [FormFieldSchema],
      required: true,
    },
    country: {
      type: String,
      default: "US",
    },
    stateSpecific: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
FormTemplateSchema.index({ industry: 1, subtype: 1 });

const FormTemplate: Model<IFormTemplate> =
  mongoose.models.FormTemplate ||
  mongoose.model<IFormTemplate>("FormTemplate", FormTemplateSchema);

export default FormTemplate;
