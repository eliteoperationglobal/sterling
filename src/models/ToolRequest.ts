import mongoose, { Schema, Document, Model } from "mongoose";

export type ToolRequestType = "LOSS_RUNS" | "BOR" | "MVR" | "CREDIT_REPORT" | "OTHER_REPORT";
export type ToolRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DECLINED";

export interface IToolRequest extends Document {
  agencyId: mongoose.Types.ObjectId;
  requestType: ToolRequestType;
  status: ToolRequestStatus;
  
  // Common fields
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  submissionId?: mongoose.Types.ObjectId; // Link to related submission if applicable
  
  // Request-specific data
  requestData: {
    // For Loss Runs
    carrierName?: string;
    policyNumber?: string;
    effectiveDate?: Date;
    expirationDate?: Date;
    yearsRequested?: number;
    
    // For BOR
    currentBrokerName?: string;
    currentBrokerAddress?: string;
    effectiveDateBOR?: Date;
    
    // For Reports (MVR, Credit, etc.)
    reportType?: string;
    driverLicenseNumber?: string;
    dateOfBirth?: Date;
    ssn?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    
    // Additional notes
    notes?: string;
  };
  
  // Response/Results
  resultDocumentUrl?: string;
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const ToolRequestSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["LOSS_RUNS", "BOR", "MVR", "CREDIT_REPORT", "OTHER_REPORT"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "DECLINED"],
      default: "PENDING",
      index: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: String,
    clientPhone: String,
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
    },
    requestData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    resultDocumentUrl: String,
    adminNotes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ToolRequestSchema.index({ agencyId: 1, status: 1 });
ToolRequestSchema.index({ createdAt: -1 });

const ToolRequest: Model<IToolRequest> =
  mongoose.models.ToolRequest ||
  mongoose.model<IToolRequest>("ToolRequest", ToolRequestSchema);

export default ToolRequest;









