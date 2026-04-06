import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    submission.status = "APPROVAL_REQUESTED";
    await submission.save();

    const userId = (session.user as any).id || "";
    const userName = (session.user as any).name || (session.user as any).agencyName || "Agency User";
    const userEmail = (session.user as any).email || "unknown@agency.com";
    const userRole = (session.user as any).role || "agency_admin";

    const activityPayload = createActivityLogData(
      "APPROVAL_REQUESTED",
      `Approval requested by ${userName}`,
      {
        submissionId: submission._id.toString(),
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole,
        },
      }
    );

    logActivity(activityPayload);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Failed request approval:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request approval" },
      { status: 500 }
    );
  }
}