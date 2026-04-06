import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";
import Submission from "@/models/Submission";
import { getModel } from "@/lib/getModel";
import BoundPolicySchema from "@/models/BoundPolicy";

const BoundPolicy: any = getModel("BoundPolicy", BoundPolicySchema);

export async function POST(req: Request) {
  try {
    await connectDB();

    const { requestId } = await req.json();

    const request = await CancelRequest.findById(requestId);

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    // ⭐ Check if policy exists
    const policy = await BoundPolicy.findOne({
      submissionId: request.submissionId,
    });

    if (policy) {
      // ⭐ cancel bound policy
      policy.status = "CANCELLED";
      await policy.save();
    } else {
      // ⭐ if no policy → cancel submission
      await Submission.findByIdAndUpdate(request.submissionId, {
        status: "CANCELLED",
      });
    }

    // ⭐ approve cancel request
    request.status = "APPROVED";
    await request.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false });
  }
}