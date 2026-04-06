import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/bind/approve
 * Admin API to approve a bind request
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

    // Only system admin can approve bind requests
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

    // Fetch submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Validate bindRequested === true
    if (!submission.bindRequested) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission does not have a bind request. Please request bind first.",
        },
        { status: 400 }
      );
    }

    // Check if already approved
    if (submission.bindApproved) {
      return NextResponse.json(
        {
          success: false,
          error: "Bind request has already been approved",
        },
        { status: 400 }
      );
    }

    // Find the quote for this submission
    const quote = await Quote.findOne({ submissionId: submission._id });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found for this submission" },
        { status: 404 }
      );
    }

    // Update submission
    const bindApprovedAt = new Date();
    submission.bindApproved = true;
    submission.bindApprovedAt = bindApprovedAt;
    submission.bindStatus = "BOUND";
    submission.status = "BOUND";
    
    console.log(`🔒 [BIND APPROVE] Updating submission ${submissionId}`);
    console.log(`   bindApproved: ${submission.bindApproved}`);
    console.log(`   bindApprovedAt: ${bindApprovedAt}`);
    console.log(`   bindStatus: ${submission.bindStatus}`);
    console.log(`   status: ${submission.status}`);
    
    await submission.save();
    
    // Verify submission was saved
    const verifySubmission = await Submission.findById(submissionId).select("bindApproved bindStatus status").lean();
    console.log(`🔒 [BIND APPROVE] Verified submission save:`, {
      bindApproved: verifySubmission?.bindApproved,
      bindStatus: verifySubmission?.bindStatus,
      status: verifySubmission?.status,
    });

    // Update quote status to BOUND
    console.log(`🔒 [BIND APPROVE] Updating quote ${quote._id} to BOUND`);
    quote.status = "BOUND";
    await quote.save();
    
    // Verify quote was saved
    const verifyQuote = await Quote.findById(quote._id).select("status").lean();
    console.log(`🔒 [BIND APPROVE] Verified quote save:`, {
      status: verifyQuote?.status,
    });

    // Log activity: Bind approved / Policy bound
    await logActivity(
      createActivityLogData(
        "POLICY_BOUND",
        `Policy bound by admin`,
        {
          submissionId: submissionId,
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            clientName: submission.clientContact?.name,
            bindApprovedAt: bindApprovedAt.toISOString(),
          },
        }
      )
    );

    console.log(`✅ Bind request approved for submission ${submissionId}`);
    console.log(`   Submission status: BOUND`);
    console.log(`   Quote status: BOUND`);
    console.log(`   Bind approved at: ${bindApprovedAt}`);

    return NextResponse.json({
      success: true,
      message: "Policy bound successfully.",
    });
  } catch (error: any) {
    console.error("Bind approve error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve bind request",
      },
      { status: 500 }
    );
  }
}



