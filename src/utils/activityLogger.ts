import ActivityLog, { ActivityType } from "@/models/ActivityLog";
import connectDB from "@/lib/mongodb";

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






