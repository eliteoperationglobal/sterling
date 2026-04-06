import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityType =
  | "SUBMISSION_CREATED"
  | "APPROVAL_REQUESTED"
  | "SUBMISSION_UPDATED"
  | "SUBMISSION_ROUTED"
  | "QUOTE_CREATED"
  | "QUOTE_UPDATED"
  | "QUOTE_APPROVED"
  | "DOCUMENT_GENERATED"
  | "DOCUMENT_SIGNED"
  | "PAYMENT_RECEIVED"
  | "BIND_REQUESTED"
  | "BIND_APPROVED"
  | "POLICY_BOUND"
  | "ADMIN_NOTE_ADDED"
  | "STATUS_CHANGED"
  | "FILE_UPLOADED"
  | "FILE_DELETED";

export interface IActivityLog extends Document {
  // Related entities
  submissionId?: mongoose.Types.ObjectId;
  quoteId?: mongoose.Types.ObjectId;
  
  // Activity details
  activityType: ActivityType;
  description: string;
  details?: Record<string, any>; // Additional context
  
  // User information
  performedBy: {
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  
  // Notification status
  dismissed?: boolean;
  dismissedByAdmin?: boolean;
  dismissedByAgency?: boolean;
  
  // Timestamp
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      index: true,
    },
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        "SUBMISSION_CREATED",
        "APPROVAL_REQUESTED",
        "SUBMISSION_UPDATED",
        "SUBMISSION_ROUTED",
        "QUOTE_CREATED",
        "QUOTE_UPDATED",
        "QUOTE_APPROVED",
        "DOCUMENT_GENERATED",
        "DOCUMENT_SIGNED",
        "PAYMENT_RECEIVED",
        "BIND_REQUESTED",
        "BIND_APPROVED",
        "POLICY_BOUND",
        "ADMIN_NOTE_ADDED",
        "STATUS_CHANGED",
        "FILE_UPLOADED",
        "FILE_DELETED",
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
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
    dismissed: {
      type: Boolean,
      default: false,
      index: true,
    },
    dismissedByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    dismissedByAgency: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
ActivityLogSchema.index({ submissionId: 1, createdAt: -1 });
ActivityLogSchema.index({ quoteId: 1, createdAt: -1 });
ActivityLogSchema.index({ "performedBy.userId": 1, createdAt: -1 });
ActivityLogSchema.index({ dismissedByAdmin: 1, createdAt: -1 });
ActivityLogSchema.index({ dismissedByAgency: 1, createdAt: -1 });

// Delete model from cache if it exists (to handle schema changes in development)
if (mongoose.models.ActivityLog) {
  delete mongoose.models.ActivityLog;
}

const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;






