import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PaymentService } from "@/lib/services/payment";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * GET /api/payment/status/[submissionId]
 * Get payment and e-signature status for a submission
 * Returns: paymentStatus, paymentDate, paymentAmount, paymentMethod, esignCompleted, esignCompletedAt
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get payment status using PaymentService
    const paymentStatus = await PaymentService.getPaymentStatus(
      params.submissionId
    );

    if (!paymentStatus) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get e-signature status
    const submission = await Submission.findById(params.submissionId)
      .select("esignCompleted esignCompletedAt")
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paymentStatus: paymentStatus.paymentStatus || "PENDING",
      paymentDate: paymentStatus.paymentDate || null,
      paymentAmount: paymentStatus.paymentAmount || null,
      paymentMethod: paymentStatus.paymentMethod || null,
      esignCompleted: submission.esignCompleted || false,
      esignCompletedAt: submission.esignCompletedAt || null,
    });
  } catch (error: any) {
    console.error("Payment status API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}

