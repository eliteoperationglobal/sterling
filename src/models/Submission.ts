import mongoose, { Schema, Document, Model } from "mongoose";
import Counter from "./Counter";

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVAL_REQUESTED"
  | "ROUTED"
  | "QUOTED"
  | "BIND_REQUESTED"
  | "BOUND"
  | "DECLINED"
  | "CANCELLED";

export interface IFileUpload {
  fieldKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt?: Date;
}

export interface ISignedDocument {
  documentType: "PROPOSAL" | "FINANCE_AGREEMENT" | "CARRIER_FORM" | "ADMIN_UPLOAD";
  documentName: string;
  documentUrl: string;
  generatedAt: Date;
  sentForSignatureAt?: Date;
  signedAt?: Date;
  signedBy?: string;
  signatureStatus: "GENERATED" | "SENT" | "SIGNED" | "DECLINED";
  esignEnvelopeId?: string;
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

  //for updating submission to small number
  submissionNumber: number;

  // Program/Product Info
  programId?: string; // e.g., "advantage-contractor-gl"
  programName?: string; // e.g., "Advantage Contractor GL"

  // Application PDF (sent to carrier)
  applicationPdfUrl?: string;
  submittedToCarrierAt?: Date;
  carrierEmail?: string;

  // E-Signature fields
  signedDocuments: ISignedDocument[];
  esignCompleted: boolean;
  esignCompletedAt?: Date;

  // Payment fields
  paymentOption?: "Full Pay" | "Premium Financial Partners Co.";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paymentDate?: Date;
  paymentMethod?: string;
  paymentAmount?: number;

  // Bind Request fields
  // Bind Request only after e-sign + payment
  // Admin must bind manually
  bindRequested?: boolean;
  bindRequestedAt?: Date;
  bindApproved?: boolean;
  bindApprovedAt?: Date;
  bindStatus?: "NOT_REQUESTED" | "REQUESTED" | "BOUND";

  // Final Policy Documents (uploaded by admin after carrier issues policy)
  finalPolicyDocuments?: {
    finalBinderPdfUrl?: string;
    finalBinderUploadedAt?: Date;
    finalPolicyPdfUrl?: string;
    finalPolicyUploadedAt?: Date;
    certificateOfInsuranceUrl?: string;
    certificateUploadedAt?: Date;
    uploadedByAdminId?: mongoose.Types.ObjectId;
  };

  // Final Policy Details
  policyNumber?: string;
  effectiveDate?: Date;
  expirationDate?: Date;

  // Admin notes
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const FileUploadSchema: Schema = new Schema({
  fieldKey: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
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
    submissionNumber: {
      type: Number,
      unique: true,
      index: true,
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "FormTemplate",
      required: false, // Optional - not all submissions use templates
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
      enum: ["DRAFT", "SUBMITTED", "APPROVAL_REQUESTED", "ROUTED", "QUOTED", "BIND_REQUESTED", "BOUND", "DECLINED", "CANCELLED"],
      default: "DRAFT",
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
    // Program/Product Info
    programId: {
      type: String,
      index: true,
    },
    programName: {
      type: String,
    },
    // Application PDF (sent to carrier)
    applicationPdfUrl: {
      type: String,
    },
    submittedToCarrierAt: {
      type: Date,
    },
    carrierEmail: {
      type: String,
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
    // UI LOGIC NOTE: 
    // - Payment is locked until esignCompleted === true
    // - When paymentStatus === "PAID" && esignCompleted === true, "Request Bind" button should be unlocked
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true,
    },
    paymentDate: Date,
    paymentMethod: String,
    paymentAmount: Number,
    paymentOption: {
      type: String,
      enum: ["Full Pay", "Premium Financial Partners Co."],
    },
    // Bind Request fields
    // Bind Request only after e-sign + payment
    // Admin must bind manually
    bindRequested: {
      type: Boolean,
      default: false,
      index: true,
    },
    bindRequestedAt: Date,
    bindApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    bindApprovedAt: Date,
    bindStatus: {
      type: String,
      enum: ["NOT_REQUESTED", "REQUESTED", "BOUND"],
      default: "NOT_REQUESTED",
      index: true,
    },
    // Final Policy Documents (uploaded by admin after carrier issues policy)
    finalPolicyDocuments: {
      finalBinderPdfUrl: String,
      finalBinderUploadedAt: Date,
      finalPolicyPdfUrl: String,
      finalPolicyUploadedAt: Date,
      certificateOfInsuranceUrl: String,
      certificateUploadedAt: Date,
      uploadedByAdminId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    policyNumber: {
      type: String,
      trim: true,
    },
    effectiveDate: Date,
    expirationDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SubmissionSchema.index({ agencyId: 1, status: 1 });
SubmissionSchema.index({ createdAt: -1 });

SubmissionSchema.pre("save", async function (next) {
  if (this.isNew && !this.submissionNumber) {
    const counter = await Counter.findOneAndUpdate(
      { name: "submissionNumber" },
      { $inc: { seq: 1 } },
      { new: true }
    );

    if (!counter) {
      return next(new Error("Counter not initialized"));
    }

    this.submissionNumber = counter.seq;
  }

  next();
});

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
