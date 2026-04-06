import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import Submission from "@/models/Submission";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { note, notifyList } = await req.json();

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const submission = await Submission.findOne({
      _id: params.id,
      agencyId: (session.user as any).agencyId,
    }).lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const userEmail = (session.user as any).email || "unknown@agency.com";
    const userName = (session.user as any).name || (session.user as any).agencyName || "Agency User";

    const logData = createActivityLogData(
      "ADMIN_NOTE_ADDED",
      note,
      {
        submissionId: params.id,
        user: {
          id: (session.user as any).id,
          name: userName,
          email: userEmail,
          role: (session.user as any).role || "agency_user",
        },
        details: {
          notifyList: notifyList || [],
          source: "agency_portal"
        },
      }
    );

    // Call without awaiting to not block the request
    logActivity(logData);

    return NextResponse.json({
      success: true,
      note: {
        _id: Math.random().toString(36).substring(7),
        activityType: "ADMIN_NOTE_ADDED",
        description: note,
        createdAt: new Date(),
        performedBy: {
          userId: (session.user as any).id,
          userName: userName
        }
      }
    });
  } catch (error: any) {
    console.error("Failed to add note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add note" },
      { status: 500 }
    );
  }
}
