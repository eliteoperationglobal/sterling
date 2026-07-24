export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";

export interface TaskItem {
  id: string;
  type: "QUOTE_REQUEST" | "PENDING_SUBJECTIVE" | "BIND_REQUEST";
  title: string;
  subtitle: string;
  category: string;
  clientName: string;
  agencyName: string;
  agentName?: string;
  submissionId: string;
  submissionNumber?: number;
  quoteId?: string;
  subjectiveDocName?: string;
  requestedAt: string;
  daysOverdue: number;
  isUrgent: boolean;
  status: string;
  targetUrl: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure referenced models are registered
    await import("@/models/Agency");
    await import("@/models/FormTemplate");
    await import("@/models/Carrier");

    const now = new Date();

    // 1. Fetch Quote Requests (Submissions waiting for admin quote: SUBMITTED, APPROVAL_REQUESTED, ROUTED)
    const quoteRequestSubmissions = await Submission.find({
      status: { $in: ["SUBMITTED", "APPROVAL_REQUESTED", "ROUTED"] },
    })
      .populate("agencyId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const quoteRequestTasks: TaskItem[] = quoteRequestSubmissions.map((sub: any) => {
      const created = new Date(sub.createdAt || now);
      const diffMs = now.getTime() - created.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const clientName = sub.clientContact?.name || "Unnamed Account";
      const agencyName = sub.agencyId?.name || "Unknown Agency";
      const agentName = sub.agentName || "Agent";

      return {
        id: `quote-req-${sub._id}`,
        type: "QUOTE_REQUEST",
        title: `Quote Needed for ${clientName}`,
        subtitle: `Submission #${sub.submissionNumber || sub._id.toString().substring(0, 8)} • ${sub.programName || "General Liability"}`,
        category: "Quote Request",
        clientName,
        agencyName,
        agentName,
        submissionId: sub._id.toString(),
        submissionNumber: sub.submissionNumber,
        requestedAt: created.toISOString(),
        daysOverdue,
        isUrgent: daysOverdue >= 1, // Any quote request older than 24 hours is urgent
        status: sub.status,
        targetUrl: `/admin/submissions/${sub._id}/quote`,
      };
    });

    // 2. Fetch Pending Subjectives (Custom documents on quotes that are required from the agent)
    const activeQuotes = await Quote.find({})
      .populate({
        path: "submissionId",
        select: "clientContact agentName agencyId submissionNumber programName status",
        populate: { path: "agencyId", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const pendingSubjectiveTasks: TaskItem[] = [];

    activeQuotes.forEach((quote: any) => {
      const customDocs: string[] = quote.customDocuments || [];
      if (!customDocs || customDocs.length === 0) return;

      let checkedMap: Record<string, boolean> = {};
      if (quote.checkedDocuments) {
        if (quote.checkedDocuments instanceof Map) {
          checkedMap = Object.fromEntries(quote.checkedDocuments);
        } else if (typeof quote.checkedDocuments === "object") {
          checkedMap = quote.checkedDocuments;
        }
      }

      const sub = quote.submissionId;
      if (!sub) return;

      const clientName = sub.clientContact?.name || "Unnamed Account";
      const agencyName = sub.agencyId?.name || "Unknown Agency";
      const agentName = sub.agentName || "Agent";
      const requestedDate = new Date(quote.postedAt || quote.createdAt || now);
      const diffMs = now.getTime() - requestedDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      customDocs.forEach((docName, idx) => {
        const isReceived = !!checkedMap[docName];
        if (!isReceived) {
          pendingSubjectiveTasks.push({
            id: `subj-${quote._id}-${idx}`,
            type: "PENDING_SUBJECTIVE",
            title: `Subjective: ${docName}`,
            subtitle: `Account: ${clientName} • Sub #${sub.submissionNumber || sub._id?.toString().substring(0, 8)}`,
            category: "Pending Subjective",
            clientName,
            agencyName,
            agentName,
            submissionId: sub._id?.toString(),
            submissionNumber: sub.submissionNumber,
            quoteId: quote._id.toString(),
            subjectiveDocName: docName,
            requestedAt: requestedDate.toISOString(),
            daysOverdue,
            isUrgent: daysOverdue >= 3, // Overdue when > 3 days (e.g. Monday to following week = 7 days overdue)
            status: sub.status,
            targetUrl: `/admin/submissions/${sub._id}`,
          });
        }
      });
    });

    // 3. Fetch Bind Requests waiting for admin approval
    const bindRequestSubmissions = await Submission.find({
      $or: [
        { bindRequested: true, bindApproved: { $ne: true } },
        { status: "BIND_REQUESTED" },
      ],
    })
      .populate("agencyId", "name")
      .sort({ updatedAt: -1 })
      .lean();

    const bindRequestTasks: TaskItem[] = bindRequestSubmissions.map((sub: any) => {
      const requestedDate = new Date(sub.bindRequestedAt || sub.updatedAt || now);
      const diffMs = now.getTime() - requestedDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const clientName = sub.clientContact?.name || "Unnamed Account";
      const agencyName = sub.agencyId?.name || "Unknown Agency";
      const agentName = sub.agentName || "Agent";

      return {
        id: `bind-req-${sub._id}`,
        type: "BIND_REQUEST",
        title: `Bind Policy for ${clientName}`,
        subtitle: `Submission #${sub.submissionNumber || sub._id.toString().substring(0, 8)} • Payment Paid`,
        category: "Bind Request",
        clientName,
        agencyName,
        agentName,
        submissionId: sub._id.toString(),
        submissionNumber: sub.submissionNumber,
        requestedAt: requestedDate.toISOString(),
        daysOverdue,
        isUrgent: daysOverdue >= 1,
        status: "BIND_REQUESTED",
        targetUrl: `/admin/bind-requests`,
      };
    });

    // Combine all tasks and sort by daysOverdue descending (most overdue first)
    const allTasks: TaskItem[] = [
      ...quoteRequestTasks,
      ...pendingSubjectiveTasks,
      ...bindRequestTasks,
    ].sort((a, b) => b.daysOverdue - a.daysOverdue);

    const urgentCount = allTasks.filter((t) => t.isUrgent || t.daysOverdue > 0).length;

    return NextResponse.json({
      success: true,
      tasks: allTasks,
      counts: {
        total: allTasks.length,
        urgent: urgentCount,
        quoteRequests: quoteRequestTasks.length,
        pendingSubjectives: pendingSubjectiveTasks.length,
        bindRequests: bindRequestTasks.length,
      },
    });
  } catch (error: any) {
    console.error("Things To Do fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch things to do" },
      { status: 500 }
    );
  }
}