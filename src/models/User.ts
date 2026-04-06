import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "agency_admin" | "agency_user" | "system_admin";

export interface IUser extends Document {
  agencyId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["agency_admin", "agency_user", "system_admin"],
      default: "agency_user",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for faster queries (email already has unique index, so only add agencyId)
UserSchema.index({ agencyId: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
