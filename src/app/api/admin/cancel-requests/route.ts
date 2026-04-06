import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";

export async function GET() {
  try {
    await connectDB();

    const requests = await CancelRequest.find({})
      .populate("submissionId")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false });
  }
}