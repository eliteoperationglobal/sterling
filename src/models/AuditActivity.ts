import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditActivity extends Document {
  auditId: mongoose.Types.ObjectId; // ref to Audit
  user: string;
  role: string;
  activity: string;
  details?: string;
  timestamp: Date;
}

const AuditActivitySchema = new Schema<IAuditActivity>({
  auditId: { type: Schema.Types.ObjectId, ref: "Audit", required: true, index: true },
  user: { type: String, required: true }, // e.g. "System", "Admin User", "Agency User"
  role: { type: String, required: true }, // e.g. "System", "Underwriter", "Admin", "Agency"
  activity: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const AuditActivity = (mongoose.models.AuditActivity as Model<IAuditActivity>) || mongoose.model<IAuditActivity>("AuditActivity", AuditActivitySchema);

export default AuditActivity;
