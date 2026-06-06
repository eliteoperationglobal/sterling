import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requests = await CancelRequest.find({})
      .populate("submissionId")
      .sort({ createdAt: -1 })
      .lean();

    const BoundPolicy: any = (await import("@/models/BoundPolicy")).default;
    const submissionIds = requests.map((r: any) => r.submissionId?._id).filter(Boolean);
    
    const policies = await BoundPolicy.find({ submissionId: { $in: submissionIds } }).lean();
    const policyMap: Record<string, any> = {};
    for (const p of policies as any[]) {
      policyMap[p.submissionId.toString()] = p;
    }

    const enhancedRequests = requests.map((r: any) => {
      const subId = r.submissionId?._id?.toString();
      const policy = subId ? policyMap[subId] : null;
      let scheduledDate = null;
      
      if (policy?.effectiveCancellationDate) {
        scheduledDate = policy.effectiveCancellationDate;
      } else if (r.submissionId?.effectiveCancellationDate) {
        scheduledDate = r.submissionId.effectiveCancellationDate;
      }

      return {
        ...r,
        scheduledDate,
      };
    });

    return NextResponse.json({
      success: true,
      requests: enhancedRequests,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false });
  }
}