import mongoose, { Schema, Document, Model } from "mongoose";

export type SubmissionStatus =
  | "SUBMITTED"
  | "ROUTED"
  | "QUOTED"
  | "BIND_REQUESTED"
  | "BOUND";

export interface IFileUpload {
  fieldKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ISignedDocument {
  documentType: "PROPOSAL" | "FINANCE_AGREEMENT" | "CARRIER_FORM" | "ADMIN_UPLOAD";
  documentName: string;
  documentUrl: string;
  generatedAt: Date;
  sentForSignatureAt?: Date;
  signedAt?: Date;
  signedBy?: string; // Client email
  signatureStatus: "GENERATED" | "SENT" | "SIGNED" | "DECLINED";
  esignEnvelopeId?: string; // For Dropbox Sign / DocuSign
}

export interface IClientContact {
  name: string;
  phone: string;
  email: string;
  EIN?: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface ISubmission extends Document {
  agencyId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  payload: Record<string, any>;
  files: IFileUpload[];
  status: SubmissionStatus;
  clientContact: IClientContact;
  ccpaConsent: boolean;
  state: string; // CA, etc.
  
  // E-Signature fields
  signedDocuments: ISignedDocument[];
  esignCompleted: boolean;
  esignCompletedAt?: Date;
  
  // Payment fields
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paymentDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const FileUploadSchema: Schema = new Schema({
  fieldKey: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
});

const SignedDocumentSchema: Schema = new Schema({
  documentType: {
    type: String,
    enum: ["PROPOSAL", "FINANCE_AGREEMENT", "CARRIER_FORM", "ADMIN_UPLOAD"],
    required: true,
  },
  documentName: { type: String, required: true },
  documentUrl: { type: String, required: true },
  generatedAt: { type: Date, required: true, default: Date.now },
  sentForSignatureAt: Date,
  signedAt: Date,
  signedBy: String,
  signatureStatus: {
    type: String,
    enum: ["GENERATED", "SENT", "SIGNED", "DECLINED"],
    required: true,
    default: "GENERATED",
  },
  esignEnvelopeId: String,
});

const ClientContactSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  EIN: String,
  businessAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
});

const SubmissionSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "FormTemplate",
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    files: {
      type: [FileUploadSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "ROUTED", "QUOTED", "BIND_REQUESTED", "BOUND"],
      default: "SUBMITTED",
      index: true,
    },
    clientContact: {
      type: ClientContactSchema,
      required: true,
    },
    ccpaConsent: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      default: "CA",
      index: true,
    },
    // E-Signature fields
    signedDocuments: {
      type: [SignedDocumentSchema],
      default: [],
    },
    esignCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    esignCompletedAt: Date,
    // Payment fields
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true,
    },
    paymentDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SubmissionSchema.index({ agencyId: 1, status: 1 });
SubmissionSchema.index({ createdAt: -1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
