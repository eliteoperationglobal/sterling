import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { getModel } from "@/lib/getModel";
import BoundPolicySchema from "@/models/BoundPolicy";

const BoundPolicy: any = getModel("BoundPolicy", BoundPolicySchema);

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Return 401 Unauthorized if secret is missing or incorrect
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Process scheduled cancellations for Bound Policies
    const policiesToCancel = await BoundPolicy.find({
      status: { $ne: "CANCELLED" },
      effectiveCancellationDate: { $lte: new Date() },
    });

    for (const policy of policiesToCancel) {
      policy.status = "CANCELLED";
      await policy.save();
    }

    // 2. Process scheduled cancellations for Submissions without bound policies
    const submissionsToCancel = await Submission.find({
      status: { $ne: "CANCELLED" },
      effectiveCancellationDate: { $lte: new Date() },
    });

    for (const sub of submissionsToCancel) {
      sub.status = "CANCELLED";
      await sub.save();
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled cancellations processed successfully",
      policiesCancelled: policiesToCancel.length,
      submissionsCancelled: submissionsToCancel.length,
    });
  } catch (err: any) {
    console.error("Cron Error processing cancellations:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
