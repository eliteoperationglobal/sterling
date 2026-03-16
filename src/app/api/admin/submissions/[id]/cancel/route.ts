import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { getModel } from "@/lib/getModel";
import BoundPolicySchema from "@/models/BoundPolicy";

const BoundPolicy: any = getModel("BoundPolicy", BoundPolicySchema);

/**
 * POST /api/admin/submissions/[id]/cancel
 * Directly cancel a submission by admin
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const submissionId = params.id;

    // 1. Check if policy exists and cancel it if it does
    const policy = await BoundPolicy.findOne({ submissionId });
    if (policy) {
      policy.status = "CANCELLED";
      await policy.save();
    }

    // 2. Update submission status
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { status: "CANCELLED" },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel submission" },
      { status: 500 }
    );
  }
}
