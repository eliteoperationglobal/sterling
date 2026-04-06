import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Draft Model
 * 
 * Stores form drafts for auto-save functionality
 * Allows users to resume their work after page refresh
 */

export interface IDraft extends Document {
  _id: mongoose.Types.ObjectId;
  formType: string; // e.g., "admin_quote", "agency_submission", "agency_quote"
  formId: string; // Unique identifier for the form (e.g., submissionId, quoteId)
  userId: mongoose.Types.ObjectId; // User who created/owns the draft
  userRole: string; // User's role (system_admin, agency)
  data: Record<string, any>; // Form data (JSON)
  lastSaved: Date; // When draft was last saved
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    formType: {
      type: String,
      required: true,
      index: true,
    },
    formId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ["system_admin", "agency"],
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    lastSaved: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index for efficient queries (formType + formId + userId)
DraftSchema.index({ formType: 1, formId: 1, userId: 1 }, { unique: true });

// Index for cleanup queries (older than 30 days)
DraftSchema.index({ lastSaved: 1 });

const Draft: Model<IDraft> =
  mongoose.models.Draft || mongoose.model<IDraft>("Draft", DraftSchema);

export default Draft;






