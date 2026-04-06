import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import { ESignService } from "@/lib/services/esign";

/**
 * GET /api/esign/status/[submissionId]
 * Get e-signature status for a submission
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

    const status = await ESignService.checkStatus(params.submissionId);

    if (!status) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...status,
    });
  } catch (error: any) {
    console.error("E-sign status API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get e-signature status" },
      { status: 500 }
    );
  }
}

