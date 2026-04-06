import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

/**
 * GET /api/payments/[id]
 * Get payment status
 */
export async function GET(
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

    await connectDB();

    const payment = await Payment.findById(params.id)
      .populate("paidBy", "name email")
      .lean();

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment,
    });
  } catch (error: any) {
    console.error("Payment status fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}

