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

export interface INote {
  noteId: string;
  text: string;
  addedBy: {
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  createdAt: Date;
}

export interface ISubmission extends Document {
  agencyId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  agentName?: string;
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
  hasNewEdits: boolean;

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

  // Binder and Policy Docs uploaded during bind approval
  binderUrl?: string;
  policyDocsUrl?: string;

  // Final Policy Details
  policyNumber?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  selectedCarrierId?: mongoose.Types.ObjectId;

  // Notes from admin or agency
  notes: INote[];
  adminNotes?: string;

  effectiveCancellationDate?: Date;

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

const NoteSchema: Schema = new Schema({
  noteId: {
    type: String,
    default: () => new Date().getTime().toString(),
  },
  text: {
    type: String,
    required: true,
  },
  addedBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

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
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    agentName: {
      type: String,
      trim: true,
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
    hasNewEdits: {
      type: Boolean,
      default: false,
    },
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
    // Binder and Policy Docs uploaded during bind approval
    binderUrl: String,
    policyDocsUrl: String,
    adminNotes: {
      type: String,
      trim: true,
    },
    notes: {
      type: [NoteSchema],
      default: [],
    },
    policyNumber: {
      type: String,
      trim: true,
    },
    effectiveDate: Date,
    expirationDate: Date,
    selectedCarrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
    },
    effectiveCancellationDate: Date,
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

// Delete model from cache if it exists (to handle schema changes in development)
if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}

const Submission: Model<ISubmission> = mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
