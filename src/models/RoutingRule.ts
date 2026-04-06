import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoutingRule extends Document {
  industry: string;
  subtype: string;
  state?: string; // Optional - if not provided, rule applies to all states
  carrierId: mongoose.Types.ObjectId;
  priority: number; // Lower number = higher priority
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutingRuleSchema: Schema = new Schema(
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
    state: {
      type: String,
      index: true,
      // Optional - null means applies to all states
    },
    carrierId: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 100,
      // Lower number = higher priority
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster rule matching
RoutingRuleSchema.index({ industry: 1, subtype: 1, state: 1 });
RoutingRuleSchema.index({ industry: 1, subtype: 1 }); // For state-agnostic rules

const RoutingRule: Model<IRoutingRule> =
  mongoose.models.RoutingRule ||
  mongoose.model<IRoutingRule>("RoutingRule", RoutingRuleSchema);

export default RoutingRule;
