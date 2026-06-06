export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import FormTemplate from "@/models/FormTemplate";
import Agency from "@/models/Agency";

/**
 * GET /api/admin/submissions
 * Get all submissions (admin only - returns all submissions regardless of agency)
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

    // Only system_admin can access admin APIs
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Import models to ensure they're registered for populate
    await import("@/models/FormTemplate");
    await import("@/models/Agency");
    const Quote = (await import("@/models/Quote")).default;

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query - no agencyId filter for admin
    const query: any = {};

    // Filter by status
    if (status && status !== "ALL") {
      const CancelRequest: any = (await import("@/models/CancelRequest")).default;
      const BoundPolicy: any = (await import("@/models/BoundPolicy")).default;
      
      const pendingCancels = await CancelRequest.find({ status: "PENDING" }).select("submissionId").lean();
      const scheduledPolicies = await BoundPolicy.find({ effectiveCancellationDate: { $exists: true }, status: { $ne: "CANCELLED" } }).select("submissionId").lean();
      const SubmissionModel: any = (await import("@/models/Submission")).default;
      const scheduledSubmissions = await SubmissionModel.find({ effectiveCancellationDate: { $exists: true }, status: { $ne: "CANCELLED" } }).select("_id").lean();
      
      const cancelIds = [
        ...pendingCancels.map((req: any) => req.submissionId.toString()),
        ...scheduledPolicies.map((pol: any) => pol.submissionId.toString()),
        ...scheduledSubmissions.map((sub: any) => sub._id.toString())
      ];

      if (status === "DECLINED") {
        query.status = { $in: ["DECLINED", "CANCELLED"] };
        if (cancelIds.length > 0) query._id = { $nin: cancelIds };
      } else if (status === "PENDING_CANCEL") {
        query._id = { $in: cancelIds };
      } else {
        query.status = status;
        if (cancelIds.length > 0) query._id = { $nin: cancelIds };
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Fetch all submissions with template and agency info
    console.log("[Admin Submissions API] Query:", JSON.stringify(query));

    // First, check total count
    const totalCount = await Submission.countDocuments({});
    console.log(`[Admin Submissions API] Total submissions in DB: ${totalCount}`);

    // Try to fetch with populate
    let submissions: any[];
    try {
      submissions = await Submission.find(query)
        .populate("templateId", "industry subtype title")
        .populate("agencyId", "name email")
        .sort({ createdAt: -1 })
        .lean();
      console.log(`[Admin Submissions API] Found ${submissions.length} submissions matching query`);
    } catch (populateError: any) {
      console.error("[Admin Submissions API] Populate error:", populateError);
      // Fallback: fetch without populate
      submissions = await Submission.find(query)
        .sort({ createdAt: -1 })
        .lean();
      console.log(`[Admin Submissions API] Found ${submissions.length} submissions (without populate)`);
    }

    // Format response
    if (!Array.isArray(submissions)) {
      console.error("[Admin Submissions API] Submissions is not an array:", typeof submissions);
      return NextResponse.json({
        submissions: [],
        count: 0,
        error: "Invalid data format",
      });
    }

    // --- Fetch Quote records to get effectiveDate (same logic as agency API) ---
    const submissionIds = submissions.map((s: any) => s._id);
    const quotes = await Quote.find({
      submissionId: { $in: submissionIds },
      status: { $in: ["POSTED", "APPROVED", "BOUND"] },
    })
      .select("submissionId effectiveDate")
      .sort({ createdAt: 1 })
      .lean();

    // Build submissionId → effectiveDate map (last quote with a date wins)
    const quoteEffectiveDateMap: Record<string, string | null> = {};
    for (const q of quotes as any[]) {
      if (q.effectiveDate) {
        quoteEffectiveDateMap[q.submissionId.toString()] = q.effectiveDate;
      }
    }

    // --- Fetch CancelRequests and Scheduled Cancellations ---
    const CancelRequest: any = (await import("@/models/CancelRequest")).default;
    const BoundPolicy: any = (await import("@/models/BoundPolicy")).default;
    
    const cancelRequests = await CancelRequest.find({
      submissionId: { $in: submissionIds },
      status: "PENDING",
    }).select("submissionId").lean();

    const scheduledPolicies = await BoundPolicy.find({
      submissionId: { $in: submissionIds },
      effectiveCancellationDate: { $exists: true },
      status: { $ne: "CANCELLED" }
    }).select("submissionId").lean();

    const pendingCancelMap: Record<string, boolean> = {};
    for (const req of cancelRequests as any[]) {
      pendingCancelMap[req.submissionId.toString()] = true;
    }
    for (const pol of scheduledPolicies as any[]) {
      pendingCancelMap[pol.submissionId.toString()] = true;
    }
    for (const sub of submissions) {
      if (sub.effectiveCancellationDate && sub.status !== "CANCELLED") {
        pendingCancelMap[sub._id.toString()] = true;
      }
    }

    const formattedSubmissions = submissions.map((sub: any) => {
      const subId = sub._id.toString();
      const effectiveDate =
        quoteEffectiveDateMap[subId] ||
        sub.effectiveDate ||
        sub.payload?.effectiveDate ||
        null;

      return {
        _id: subId,
        submissionId: subId,
        submissionNumber: sub.submissionNumber ?? null,
        agencyId: sub.agencyId?._id?.toString() || null,
        agencyName: sub.agencyId?.name || "Unknown Agency",
        industry: sub.templateId?.industry || sub.programName || "Unknown",
        subtype: sub.templateId?.subtype || "Unknown",
        templateTitle: sub.templateId?.title || sub.programName || "Unknown",
        programId: sub.programId || null,
        programName: sub.programName || null,
        clientName: sub.clientContact?.name || "N/A",
        clientEmail: sub.clientContact?.email || "N/A",
        clientPhone: sub.clientContact?.phone || "N/A",
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        fileCount: sub.files?.length || 0,
        state: sub.state || "N/A",
        applicationPdfUrl: sub.applicationPdfUrl || null,
        submittedToCarrierAt: sub.submittedToCarrierAt || null,
        bindApprovedAt: sub.bindApprovedAt || null,
        effectiveDate,
        effectiveCancellationDate: sub.effectiveCancellationDate || null,
        cancelRequested: !!pendingCancelMap[subId],
      };
    });

    return NextResponse.json({
      submissions: formattedSubmissions,
      count: formattedSubmissions.length,
    });
  } catch (error: any) {
    console.error("Admin submissions API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

