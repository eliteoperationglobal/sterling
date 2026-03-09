import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/admin/bind-requests/approve
 * Approve a bind request (admin-only)
 * Body: { submissionId }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Must have a bind request first
    if (!(submission as any).bindRequested) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission does not have a bind request. Please request bind first.",
        },
        { status: 400 }
      );
    }

    // Already approved?
    if ((submission as any).bindApproved) {
      return NextResponse.json(
        {
          success: false,
          error: "Bind request has already been approved",
        },
        { status: 400 }
      );
    }

    // Find quote for this submission
    const quote = await Quote.findOne({ submissionId: submission._id });
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found for this submission" },
        { status: 404 }
      );
    }

    const bindApprovedAt = new Date();
    (submission as any).bindApproved = true;
    (submission as any).bindApprovedAt = bindApprovedAt;
    (submission as any).bindStatus = "BOUND";
    submission.status = "BOUND";

    await submission.save();

    quote.status = "BOUND";
    await quote.save();

    await logActivity(
      createActivityLogData(
        "POLICY_BOUND",
        "Policy bound by admin",
        {
          submissionId: submissionId,
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name:
              (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            clientName: (submission as any).clientContact?.name,
            bindApprovedAt: bindApprovedAt.toISOString(),
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      message: "Policy bound successfully.",
    });
  } catch (error: any) {
    console.error("Admin bind-requests approve error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve bind request",
      },
      { status: 500 }
    );
  }
}

