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
        carrierId
      };

      // If policyType is provided, filter by it. Or if it's GENERAL_LIABILITY, it might be stored as missing or GENERAL_LIABILITY.
      if (policyType) {
        if (policyType === 'GENERAL_LIABILITY') {
          quoteFilter.policyType = { $in: ['GENERAL_LIABILITY', null, undefined] };
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
    submission.status = "BIND_REQUESTED";
    (submission as any).bindRequested = true;
    (submission as any).bindRequestedAt = new Date();

    await submission.save();

    const userId = (session.user as any).id || "";
    const userName = (session.user as any).name || (session.user as any).agencyName || "Agency User";
    const userEmail = (session.user as any).email || "unknown@agency.com";
    const userRole = (session.user as any).role || "agency_admin";

    const activityPayload = createActivityLogData(
      "BIND_REQUESTED",
      `Bind requested for submission #${submission.submissionNumber || submission._id}`,
      {
        submissionId: submission._id.toString(),
        details: { quotesToBind },
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole,
        },
      }
    );

    logActivity(activityPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to request bind:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request bind" },
      { status: 500 }
    );
  }
}