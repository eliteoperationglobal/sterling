import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditStatus =
  | "REQUESTED"
  | "DOCS_RECEIVED"
  | "UNDERWRITER_REVIEW"
  | "APPROVED"
  | "FINALIZED"
  | "INVOICE_DUE"
  | "COMPLETE"
  | "CANCELLED";

export type AuditDocumentStatus = 
  | "REQUESTED"
  | "RECEIVED"
  | "VERIFIED"
  | "REJECTED"
  | "WAIVED";

export interface IAuditDocument {
  documentId: string;
  name: string;
  status: AuditDocumentStatus;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
  verifiedAt?: Date;
  waiverReason?: string;
  rejectionReason?: string;
}

export interface IAudit extends Document {
  auditId: string; // e.g. AUD-20381
  submissionId?: mongoose.Types.ObjectId;
  source: "PORTAL" | "MANUAL_AUDIT";
  policyNumber: string;
  carrier: string;
  program: string;
  agencyId?: mongoose.Types.ObjectId;
  namedInsured: string;
  clientEmail?: string;
  clientPhone?: string;
  
  auditPeriodStart: Date;
  auditPeriodEnd: Date;
  
  status: AuditStatus;
  assignedUnderwriter?: string;
  assignedAccountingUser?: string;
  createdBy: string;
  dueDate: Date;

  // Exposure
  exposureBasis: string;
  estimatedExposure: number;
  auditedExposure: number;
  rate: number;
  rateBasis: number; // e.g. per 1000
  classCode?: string;
  auditEffectiveDate: Date;
  auditNotes?: string;

  // Financial
  depositPremium: number;
  auditedPremium: number;
  surplusLinesTaxRate: number; // percentage
  stampingFeeRate: number; // percentage
  carrierFee: number;
  sterlingFee: number;
  
  surplusLinesTaxAmount: number;
  stampingFeeAmount: number;
  netChange: number; // positive means additional due, negative means return
  
  invoiceId?: string;
  paymentStatus?: "PENDING" | "PAID";

  documents: IAuditDocument[];

  createdAt: Date;
  updatedAt: Date;
}

const AuditDocumentSchema = new Schema<IAuditDocument>({
  documentId: { type: String, required: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["REQUESTED", "RECEIVED", "VERIFIED", "REJECTED", "WAIVED"], 
    default: "REQUESTED" 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  uploadedAt: { type: Date },
  uploadedBy: { type: String },
  verifiedAt: { type: Date },
  waiverReason: { type: String },
  rejectionReason: { type: String }
});

const AuditSchema = new Schema<IAudit>({
  auditId: { type: String, required: true, unique: true },
  submissionId: { type: Schema.Types.ObjectId, ref: "Submission" },
  source: { type: String, enum: ["PORTAL", "MANUAL_AUDIT"], default: "PORTAL" },
  policyNumber: { type: String, required: true },
  carrier: { type: String, required: true },
  program: { type: String, required: true },
  agencyId: { type: Schema.Types.ObjectId, ref: "Agency" },
  namedInsured: { type: String, required: true },
  clientEmail: { type: String },
  clientPhone: { type: String },
  
  auditPeriodStart: { type: Date, required: true },
  auditPeriodEnd: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: [
      "REQUESTED", "DOCS_RECEIVED", "UNDERWRITER_REVIEW", 
      "APPROVED", "FINALIZED", "INVOICE_DUE", "COMPLETE", "CANCELLED"
    ], 
    default: "REQUESTED" 
  },
  assignedUnderwriter: { type: String },
  assignedAccountingUser: { type: String },
  createdBy: { type: String, required: true },
  dueDate: { type: Date, required: true },

  // Exposure
  exposureBasis: { type: String, default: "Gross Sales" },
  estimatedExposure: { type: Number, default: 0 },
  auditedExposure: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  rateBasis: { type: Number, default: 1000 },
  classCode: { type: String },
  auditEffectiveDate: { type: Date },
  auditNotes: { type: String },

  // Financial
  depositPremium: { type: Number, default: 0 },
  auditedPremium: { type: Number, default: 0 },
  surplusLinesTaxRate: { type: Number, default: 4.85 },
  stampingFeeRate: { type: Number, default: 0.04 },
  carrierFee: { type: Number, default: 150 },
  sterlingFee: { type: Number, default: 125 },
  
  surplusLinesTaxAmount: { type: Number, default: 0 },
  stampingFeeAmount: { type: Number, default: 0 },
  netChange: { type: Number, default: 0 },
  
  invoiceId: { type: String },
  paymentStatus: { type: String, enum: ["PENDING", "PAID"] },

  documents: [AuditDocumentSchema],

}, { timestamps: true });

// Avoid OverwriteModelError
const Audit = (mongoose.models.Audit as Model<IAudit>) || mongoose.model<IAudit>("Audit", AuditSchema);

export default Audit;
