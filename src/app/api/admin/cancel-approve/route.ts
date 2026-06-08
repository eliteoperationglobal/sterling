import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";
import Submission from "@/models/Submission";
import { getModel } from "@/lib/getModel";
import BoundPolicySchema from "@/models/BoundPolicy";

const BoundPolicy: any = getModel("BoundPolicy", BoundPolicySchema);
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { requestId, cancellationDate } = await req.json();

    const request = await CancelRequest.findById(requestId);

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    let effectiveDate = new Date();
    let isFutureDate = false;

    if (cancellationDate) {
      const [year, month, day] = cancellationDate.split("-");
      effectiveDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (effectiveDate > today) {
        isFutureDate = true;
      }
    }

    // ⭐ Check if policy exists
    const policy = await BoundPolicy.findOne({
      submissionId: request.submissionId,
    });

    if (policy) {
      if (!isFutureDate) {
        policy.status = "CANCELLED";
      }
      policy.effectiveCancellationDate = effectiveDate;
      await policy.save();
    }
    
    const updateData: any = { effectiveCancellationDate: effectiveDate };
    if (!isFutureDate) {
      updateData.status = "CANCELLED";
    }
    await Submission.findByIdAndUpdate(request.submissionId, updateData);

    // ⭐ approve cancel request
    request.status = "APPROVED";
    await request.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false });
  }
}