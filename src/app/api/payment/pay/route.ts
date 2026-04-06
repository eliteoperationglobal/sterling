import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import Quote from "@/models/Quote";

export async function POST(req: NextRequest) {
  try {
    const { submissionId, amount, method } = await req.json();
    if (!submissionId || typeof amount !== "number" || !method) {
      return NextResponse.json({ error: "Missing input." }, { status: 400 });
    }

    await connectDB();
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    submission.paymentStatus = "PAID";
    submission.paymentDate = new Date();
    submission.paymentAmount = amount;
    submission.paymentMethod = method;
    await submission.save();

    // Get quote ID if available
    const quote = await Quote.findOne({ submissionId }).lean();
    const quoteId = quote?._id?.toString();

    // Log activity: Payment received
    await logActivity(
      createActivityLogData(
        "PAYMENT_RECEIVED",
        `Payment received: $${amount.toLocaleString()} via ${method}`,
        {
          submissionId: submissionId,
          quoteId: quoteId,
          user: {
            id: "system", // Payment is processed by system
            name: "Payment System",
            email: "payment@system",
            role: "system",
          },
          details: {
            amount: amount,
            method: method,
            paymentDate: submission.paymentDate.toISOString(),
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      paymentStatus: "PAID",
      paymentDate: submission.paymentDate,
      paymentAmount: submission.paymentAmount,
      paymentMethod: submission.paymentMethod,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Payment error" }, { status: 500 });
  }
}
