export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import Agency from "@/models/Agency";
import { getClientDisplayName } from "@/utils/formatters";


/**
 * GET /api/notifications
 * Get notifications for the current user based on their role
 * 
 * For Admin:
 * - New submissions from agencies
 * - New notes added to submissions
 * 
 * For Agency:
 * - New quotes posted by admin
 * - New notes added to submissions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userRole = (session.user as any)?.role || "agency_admin";
    const userEmail = session.user.email || "";
    const userId = (session.user as any)?.id || "";

    const notifications: any[] = [];

    if (userRole === "system_admin") {
      // Admin gets notified about:
      // 1. New submissions from agencies
      const adminBaseFilter = {
        dismissed: false,
        dismissedByAdmin: { $ne: true },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      };

      const newSubmissions = await ActivityLog.find({
        activityType: "SUBMISSION_CREATED",
        ...adminBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact status payload");

      // 1.b Approval requests
      const newApprovalRequests = await ActivityLog.find({
        activityType: "APPROVAL_REQUESTED",
        ...adminBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact status payload");

      // 1.c Bind requests
      const newBindRequests = await ActivityLog.find({
        activityType: "BIND_REQUESTED",
        ...adminBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact status payload");

      // 2. New bound policies
      const newPolicyBounds = await ActivityLog.find({
        activityType: "POLICY_BOUND",
        ...adminBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact status payload");

      // 3. New notes added to submissions
      const newNotes = await ActivityLog.find({
        activityType: "ADMIN_NOTE_ADDED",
        ...adminBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact payload");

      // Combine and format
      const allActivities = [...newSubmissions, ...newApprovalRequests, ...newBindRequests, ...newPolicyBounds, ...newNotes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      for (const activity of allActivities) {
        const submission = activity.submissionId as any;
        if (activity.activityType === "SUBMISSION_CREATED") {
          notifications.push({
            id: activity._id.toString(),
            type: "NEW_SUBMISSION",
            title: "New Submission",
            description: `Agency submitted: ${getClientDisplayName(submission)}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "APPROVAL_REQUESTED") {
          notifications.push({
            id: activity._id.toString(),
            type: "APPROVAL_REQUESTED",
            title: "Approval Requested",
            description: `Approval requested for ${getClientDisplayName(submission)}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "BIND_REQUESTED") {
          notifications.push({
            id: activity._id.toString(),
            type: "BIND_REQUESTED",
            title: "Bind Requested",
            description: `Bind requested for ${getClientDisplayName(submission)}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "POLICY_BOUND") {
          notifications.push({
            id: activity._id.toString(),
            type: "POLICY_BOUND",
            title: "Policy Bound",
            description: `Policy bound for ${getClientDisplayName(submission)}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "ADMIN_NOTE_ADDED") {
          notifications.push({
            id: activity._id.toString(),
            type: "NEW_NOTE",
            title: "New Note Added",
            description: `Note added for ${getClientDisplayName(submission)}: "${(activity.details?.noteText || activity.details?.text || "")?.substring(0, 50)}..."`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        }
      }
    } else {
      // Agency users get notified about:
      // 1. New quotes posted by admin for their submissions
      const agencyId = (session.user as any)?.agencyId || "";

      const userSubmissions = await Submission.find({
        agencyId,
      }).select("_id");

      const submissionIds = userSubmissions.map((s) => s._id);

      const agencyBaseFilter = {
        dismissed: false,
        dismissedByAgency: { $ne: true },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      };

      const newQuotes = await ActivityLog.find({
        activityType: "QUOTE_CREATED",
        submissionId: { $in: submissionIds },
        ...agencyBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact payload")
        .populate("quoteId", "carrierQuoteUSD status");

      const newPolicyBounds = await ActivityLog.find({
        activityType: "POLICY_BOUND",
        submissionId: { $in: submissionIds },
        ...agencyBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact payload");

      // 2. New notes added to submissions
      const newNotes = await ActivityLog.find({
        activityType: "ADMIN_NOTE_ADDED",
        submissionId: { $in: submissionIds },
        ...agencyBaseFilter,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("submissionId", "_id submissionNumber clientContact payload");

      // Combine and format
      const allActivities = [...newQuotes, ...newPolicyBounds, ...newNotes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      for (const activity of allActivities) {
        const submission = activity.submissionId as any;
        const quote = activity.quoteId as any;
        
        if (activity.activityType === "QUOTE_CREATED") {
          notifications.push({
            id: activity._id.toString(),
            type: "NEW_QUOTE",
            title: "New Quote Posted",
            description: `Quote posted for ${getClientDisplayName(submission)}: $${quote?.carrierQuoteUSD?.toLocaleString('en-US') || "0"}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            quoteId: quote?._id?.toString(),
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "POLICY_BOUND") {
          notifications.push({
            id: activity._id.toString(),
            type: "POLICY_BOUND",
            title: "Policy Bound",
            description: `Your policy is bound for ${getClientDisplayName(submission)}`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        } else if (activity.activityType === "ADMIN_NOTE_ADDED") {
          notifications.push({
            id: activity._id.toString(),
            type: "NEW_NOTE",
            title: "New Note Added",
            description: `Note added for ${getClientDisplayName(submission)}: "${(activity.details?.noteText || activity.details?.text || "")?.substring(0, 50)}..."`,
            submissionId: submission?._id?.toString(),
            submissionNumber: submission?.submissionNumber,
            timestamp: activity.createdAt,
            read: false,
          });
        }
      }
    }

    return NextResponse.json(
      {
        notifications: notifications.slice(0, 10), // Return top 10
        total: notifications.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?id=<notificationId>
 * Dismiss/remove a notification
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userRole = (session.user as any)?.role || "agency_admin";

    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");

    console.log("DELETE /api/notifications - notificationId:", notificationId, "userRole:", userRole);

    if (!notificationId) {
      console.warn("No notification ID provided");
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Mark notification as dismissed according to role
    console.log("Attempting to update ActivityLog with _id:", notificationId);

    const current = await ActivityLog.findById(notificationId);
    if (!current) {
      console.warn("ActivityLog not found with ID:", notificationId);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const updateFields: any = {};
    if (userRole === "system_admin") {
      updateFields.dismissedByAdmin = true;
    } else {
      updateFields.dismissedByAgency = true;
    }

    // If both parties have dismissed, mark global dismissed as true too
    if (
      (userRole === "system_admin" && current.dismissedByAgency) ||
      (userRole !== "system_admin" && current.dismissedByAdmin)
    ) {
      updateFields.dismissed = true;
    }

    const result = await ActivityLog.findByIdAndUpdate(
      notificationId,
      { $set: updateFields },
      { new: true }
    );

    console.log("Update result:", result ? "Success" : "Not found");

    if (!result) {
      console.warn("ActivityLog not found with ID:", notificationId);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    console.log("✅ Notification dismissed:", notificationId);
    return NextResponse.json(
      { message: "Notification dismissed successfully", _id: notificationId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return NextResponse.json(
      { error: "Failed to dismiss notification", details: (error as any).message },
      { status: 500 }
    );
  }
}
