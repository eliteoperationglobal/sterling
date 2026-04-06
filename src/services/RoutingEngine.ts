import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import FormTemplate from "@/models/FormTemplate";
import RoutingRule from "@/models/RoutingRule";
import RoutingLog from "@/models/RoutingLog";
import Carrier from "@/models/Carrier";
import mongoose from "mongoose";

/**
 * RoutingEngine - Automatically routes submissions to appropriate carriers
 * based on industry, subtype, and state (CA-aware)
 */
class RoutingEngine {
  /**
   * Route a submission to appropriate carriers
   * @param submissionId - The submission ID to route
   */
  static async routeSubmission(submissionId: string): Promise<void> {
    try {
      await connectDB();

      // Load submission with template
      const submission = await Submission.findById(submissionId).populate(
        "templateId"
      );

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      const template = submission.templateId as any;
      if (!template) {
        throw new Error(`Template not found for submission ${submissionId}`);
      }

      // Get industry, subtype, and state
      const industry = template.industry;
      const subtype = template.subtype;
      const state = submission.state || submission.clientContact?.businessAddress?.state || "CA";

      console.log(
        `[RoutingEngine] Routing submission ${submissionId}: ${industry} / ${subtype} / ${state}`
      );

      // Find matching routing rules
      // Priority: exact match (industry + subtype + state) > state-agnostic (industry + subtype)
      const exactMatchRules = await RoutingRule.find({
        industry,
        subtype,
        state: state,
        isActive: true,
      })
        .populate("carrierId")
        .sort({ priority: 1 }); // Lower priority number = higher priority

      const fallbackRules = await RoutingRule.find({
        industry,
        subtype,
        state: null, // State-agnostic rules
        isActive: true,
      })
        .populate("carrierId")
        .sort({ priority: 1 });

      // Combine rules (exact matches first, then fallbacks)
      const allRules = [...exactMatchRules, ...fallbackRules];

      if (allRules.length === 0) {
        console.warn(
          `[RoutingEngine] No routing rules found for ${industry} / ${subtype} / ${state}`
        );
        // Create a log entry for no rules found (using a dummy carrier ID)
        await RoutingLog.create({
          submissionId: submission._id,
          carrierId: new mongoose.Types.ObjectId(), // Dummy ID
          status: "FAILED",
          notes: `No routing rules found for ${industry} / ${subtype} / ${state}`,
        });
        return;
      }

      // Route to each carrier
      const routingPromises = allRules.map(async (rule) => {
        const carrier = rule.carrierId as any;
        if (!carrier) {
          console.error(`[RoutingEngine] Carrier not found for rule ${rule._id}`);
          return;
        }

        // Check if carrier serves this state
        if (
          carrier.statesServed &&
          carrier.statesServed.length > 0 &&
          !carrier.statesServed.includes(state)
        ) {
          console.log(
            `[RoutingEngine] Carrier ${carrier.name} does not serve state ${state}, skipping`
          );
          await RoutingLog.create({
            submissionId: submission._id,
            carrierId: carrier._id,
            status: "FAILED",
            notes: `Carrier does not serve state ${state}`,
          });
          return;
        }

        try {
          // Mock email sending (in production, use actual email service)
          const submissionLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/submissions/${submissionId}`;
          
          console.log(
            `[RoutingEngine] 📧 Sending email to ${carrier.email} for submission ${submissionId}`
          );
          console.log(
            `[RoutingEngine] Email content: New submission received - ${industry} / ${subtype} in ${state}`
          );
          console.log(
            `[RoutingEngine] Submission link: ${submissionLink}`
          );

          // In production, replace this with actual email sending:
          // await sendEmail({
          //   to: carrier.email,
          //   subject: `New Insurance Submission: ${industry} - ${subtype}`,
          //   body: `A new submission has been received...`,
          //   link: submissionLink
          // });

          // Create routing log with SENT status
          await RoutingLog.create({
            submissionId: submission._id,
            carrierId: carrier._id,
            status: "SENT",
            emailSent: true,
            emailSentAt: new Date(),
            notes: `Routed via rule: ${industry} / ${subtype} / ${state || "all states"}`,
          });

          console.log(
            `[RoutingEngine] ✅ Successfully routed submission ${submissionId} to carrier ${carrier.name}`
          );
        } catch (error: any) {
          console.error(
            `[RoutingEngine] ❌ Failed to route to carrier ${carrier.name}:`,
            error
          );

          // Create routing log with FAILED status
          await RoutingLog.create({
            submissionId: submission._id,
            carrierId: carrier._id,
            status: "FAILED",
            emailSent: false,
            errorMessage: error.message || "Unknown error",
            notes: `Failed to route: ${error.message}`,
          });
        }
      });

      await Promise.all(routingPromises);

      // Update submission status to ROUTED if at least one carrier was notified
      const successfulRoutes = await RoutingLog.countDocuments({
        submissionId: submission._id,
        status: "SENT",
      });

      if (successfulRoutes > 0) {
        await Submission.findByIdAndUpdate(submissionId, {
          status: "ROUTED",
        });
        console.log(
          `[RoutingEngine] ✅ Submission ${submissionId} status updated to ROUTED`
        );
      } else {
        console.warn(
          `[RoutingEngine] ⚠️ No successful routes for submission ${submissionId}`
        );
      }
    } catch (error: any) {
      console.error(`[RoutingEngine] Error routing submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Get routing logs for a submission
   */
  static async getRoutingLogs(submissionId: string) {
    await connectDB();
    return await RoutingLog.find({ submissionId })
      .populate("carrierId", "name email")
      .sort({ createdAt: -1 });
  }
}

export default RoutingEngine;
