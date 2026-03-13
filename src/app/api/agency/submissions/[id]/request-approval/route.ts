import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Fixed Status
    submission.status = "APPROVAL_REQUESTED";
    // submission.status = "QUOTED";
    await submission.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to request approval" },
      { status: 500 }
    );
  }
}