import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import mongoose, { FilterQuery } from "mongoose";
import Submission, { ISubmission } from "@/models/Submission";
import Quote, { IQuote } from "@/models/Quote";

type AgencySessionUser = {
  id?: string;
  role?: string;
  agencyId?: string;
  agencyName?: string;
  agencyAddress?: string;
  agencyCity?: string;
  agencyState?: string;
  agencyZip?: string;
  agencyPhone?: string;
  agencyEmail?: string;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as AgencySessionUser;

    if (!sessionUser.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await import("@/models/FormTemplate");

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10); // default to 1000 for legacy frontend support until fully updated
    const skip = (page - 1) * limit;

    const query: FilterQuery<ISubmission> = {
      agencyId: sessionUser.agencyId,
    };

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    type AgencySubmissionLean = Pick<ISubmission, "_id" | "submissionNumber" | "status" | "createdAt" | "updatedAt" | "state" | "agentName" | "agentId" | "payload" | "clientContact" | "templateId" | "files"> & {
      templateId?: { industry?: string; subtype?: string; title?: string };
    };

    const submissions = await Submission.find(query)
      .select("submissionNumber status createdAt updatedAt state agentName agentId payload.agentName clientContact templateId files")
      .populate("templateId", "industry subtype title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<AgencySubmissionLean[]>();

    const totalCount = await Submission.countDocuments(query);

    // ← FETCH ALL QUOTES FOR THESE SUBMISSIONS IN ONE QUERY
    const submissionIds = submissions.map((s) => s._id);
    const quotes = await Quote.find({
      submissionId: { $in: submissionIds },
      status: { $in: ["POSTED", "APPROVED", "BOUND"] },
    })
      .select("submissionId finalAmountUSD policyType createdAt")
      .sort({ createdAt: 1 })
      .lean<Pick<IQuote, "submissionId" | "finalAmountUSD" | "policyType" | "createdAt">[]>();

    // ← BUILD A MAP: submissionId → Quote Rounds (combined totals)
    const quoteMap: Record<string, { quote1Total: number | null; quote2Total: number | null; estimatedPremium: number | null }> = {};
    
    // Group quotes by submission
    const quotesBySub: Record<string, typeof quotes> = {};
    quotes.forEach((q) => {
      const subId = q.submissionId.toString();
      if (!quotesBySub[subId]) quotesBySub[subId] = [];
      quotesBySub[subId].push(q);
    });

    Object.entries(quotesBySub).forEach(([subId, subQuotes]) => {
      // Logic for grouping into rounds (same as frontend 60s window)
      const rounds: number[] = [];
      let currentRoundTotal = 0;
      let lastTimestamp = 0;

      subQuotes.forEach((q) => {
        const timestamp = new Date(q.createdAt).getTime();
        const amount = q.finalAmountUSD || 0;

        if (lastTimestamp === 0 || Math.abs(timestamp - lastTimestamp) < 60000) {
          currentRoundTotal += amount;
        } else {
          rounds.push(currentRoundTotal);
          currentRoundTotal = amount;
        }
        lastTimestamp = timestamp;
      });
      if (currentRoundTotal > 0) rounds.push(currentRoundTotal);

      quoteMap[subId] = {
        quote1Total: rounds[0] || null,
        quote2Total: rounds[1] || null,
        estimatedPremium: rounds[0] || null, // default to Quote 1 for overall estimated
      };
    });

    const formattedSubmissions = submissions.map((sub) => {
      const totals = quoteMap[sub._id.toString()] || { quote1Total: null, quote2Total: null, estimatedPremium: null };
      return {
        _id: sub._id.toString(),
        submissionNumber: sub.submissionNumber ?? 0,
        industry: sub.templateId?.industry || "Construction",
        subtype: sub.templateId?.subtype || "Unknown",
        templateTitle: sub.templateId?.title || "Unknown",
        clientName: sub.clientContact?.name || "N/A",
        clientEmail: sub.clientContact?.email || "N/A",
        clientPhone: sub.clientContact?.phone || "N/A",
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        fileCount: sub.files?.length || 0,
        state: sub.state || "N/A",
        quote1Total: totals.quote1Total,
        quote2Total: totals.quote2Total,
        estimatedPremium: totals.estimatedPremium,
        agentName: sub.agentName || sub.payload?.agentName || null,
        agentId: sub.agentId ? sub.agentId.toString() : null,
      };
    });

    return NextResponse.json({
      submissions: formattedSubmissions,
      count: formattedSubmissions.length,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch submissions";
    console.error("Submissions API error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}