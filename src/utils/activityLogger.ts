import ActivityLog, { ActivityType } from "@/models/ActivityLog";
import connectDB from "@/lib/mongodb";
import { sendAdminNotificationEmail } from "@/lib/services/email/EmailService";

const ADMIN_NOTIFICATION_TYPES: ActivityType[] = [
  "SUBMISSION_CREATED",
  "APPROVAL_REQUESTED",
  "BIND_REQUESTED",
  "POLICY_BOUND",
];

const ADMIN_NOTIFICATION_TITLES: Record<string, string> = {
  SUBMISSION_CREATED: "New Submission",
  APPROVAL_REQUESTED: "Approval Requested",
  BIND_REQUESTED: "Bind Requested",
  POLICY_BOUND: "Policy Bound",
};

export interface ActivityLogData {
  submissionId?: string;
  quoteId?: string;
  activityType: ActivityType;
  description: string;
  details?: Record<string, any>;
  performedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
}

/**
 * Log an activity to the activity log
 * This function is non-blocking and won't throw errors to avoid disrupting main operations
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    // Ensure DB connection
    await connectDB();

    // Create activity log entry
    await ActivityLog.create({
      submissionId: data.submissionId ? data.submissionId : undefined,
      quoteId: data.quoteId ? data.quoteId : undefined,
      activityType: data.activityType,
      description: data.description,
      details: data.details || {},
      performedBy: {
        userId: data.performedBy.userId,
        userName: data.performedBy.userName,
        userEmail: data.performedBy.userEmail,
        userRole: data.performedBy.userRole,
      },
    });

    console.log(`✅ Activity logged: ${data.activityType} - ${data.description}`);

    // Trigger async admin notification email if this activity is an admin notification type
    if (ADMIN_NOTIFICATION_TYPES.includes(data.activityType)) {
      const title = ADMIN_NOTIFICATION_TITLES[data.activityType] || "Admin Alert";
      const clientName = data.details?.clientName || data.details?.applicantName || data.details?.companyName || "";
      const submissionNumber = data.details?.applicationNumber || data.details?.submissionNumber || "";

      // Send email asynchronously in background - failure won't affect caller
      sendAdminNotificationEmail({
        type: data.activityType,
        title,
        description: data.description,
        submissionId: data.submissionId,
        submissionNumber,
        clientName,
        performedByName: data.performedBy.userName,
        performedByRole: data.performedBy.userRole,
        timestamp: new Date(),
      }).catch((emailErr) => {
        console.error("❌ Non-blocking admin notification email error:", emailErr);
      });
    }
  } catch (error: any) {
    // Log error but don't throw - activity logging should not break main operations
    console.error("❌ Failed to log activity:", error.message);
  }
}

/**
 * Helper function to create activity log data from session user
 */
export function createActivityLogData(
  activityType: ActivityType,
  description: string,
  options: {
    submissionId?: string;
    quoteId?: string;
    details?: Record<string, any>;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
): ActivityLogData {
  return {
    submissionId: options.submissionId,
    quoteId: options.quoteId,
    activityType,
    description,
    details: options.details || {},
    performedBy: {
      userId: options.user.id,
      userName: options.user.name,
      userEmail: options.user.email,
      userRole: options.user.role,
    },
  };
}






