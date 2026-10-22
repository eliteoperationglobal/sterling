import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { quotesToBind } = body; // Array of { policyType, carrierId }

    if (!quotesToBind || !Array.isArray(quotesToBind) || quotesToBind.length === 0) {
      return NextResponse.json(
        { error: "At least one quote must be selected for binding" },
        { status: 400 }
      );
    }

    await connectDB();

    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Process each quote to bind
    for (const bindReq of quotesToBind) {
      const { policyType, carrierId } = bindReq;
      if (!carrierId) continue;

      // Find the quote
      const quoteFilter: any = {
        submissionId: submission._id,
        carrierId,
      };

      if (policyType) {
        if (policyType === "GENERAL_LIABILITY") {
          quoteFilter.policyType = { $in: ["GENERAL_LIABILITY", null, undefined] };
        } else {
          quoteFilter.policyType = policyType;
        }
      }

      const quote = await Quote.findOne(quoteFilter);
      if (quote) {
        quote.status = "BIND_REQUESTED";
        await quote.save();
      }
    }

    // Mark submission as bind requested so it appears in admin bind-requests
    if (submission.status !== "BOUND") {
      submission.status = "BIND_REQUESTED";
    }

    (submission as any).bindRequested = true;
    (submission as any).bindRequestedAt = new Date();

    await submission.save();

    const userId = (session.user as any).id || "";
    const userName = (session.user as any).name || "System Admin";
    const userEmail = (session.user as any).email || "admin@sterling.com";

    const activityPayload = createActivityLogData(
      "BIND_REQUESTED",
      `Bind requested by Admin for submission #${submission.submissionNumber || submission._id}`,
      {
        submissionId: submission._id.toString(),
        details: { quotesToBind },
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          role: "system_admin",
        },
      }
    );

    logActivity(activityPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin request-bind error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request bind" },
      { status: 500 }
    );
  }
}
