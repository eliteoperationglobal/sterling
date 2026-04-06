import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/submissions/:id/notes
 * Add a note to a submission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Note text is required" },
        { status: 400 }
      );
    }

    // Get submission
    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check authorization (admin or agency that owns the submission)
    const userRole = (session.user as any)?.role || "agency_admin";
    const agencyId = (session.user as any)?.agencyId;

    if (
      userRole !== "system_admin" &&
      agencyId !== submission.agencyId.toString()
    ) {
      return NextResponse.json(
        { error: "Forbidden - You cannot add notes to this submission" },
        { status: 403 }
      );
    }

    // Create note
    const newNote = {
      noteId: Date.now().toString(36) + Math.random().toString(36).substring(2),
      text: text.trim(),
      addedBy: {
        userId: (session.user as any)._id,
        userName: (session.user as any).name || (session.user as any).email,
        userEmail: (session.user as any).email,
        userRole: userRole,
      },
      createdAt: new Date(),
    };

    // Add note to submission
    if (!submission.notes) {
      submission.notes = [];
    }
    submission.notes.push(newNote as any);
    await submission.save();

    // Log activity: Note added
    await logActivity(
      createActivityLogData(
        "ADMIN_NOTE_ADDED",
        `Note added by ${newNote.addedBy.userName} to submission #${submission.submissionNumber}`,
        {
          submissionId: submission._id.toString(),
          user: {
            id: (session.user as any)._id,
            name: newNote.addedBy.userName,
            email: newNote.addedBy.userEmail,
            role: userRole,
          },
          details: {
            noteText: text.trim(),
            noteId: newNote.noteId,
          },
        }
      )
    );

    return NextResponse.json(
      {
        success: true,
        note: newNote,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add note" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions/:id/notes
 * Get all notes for a submission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Get submission
    const submission = await Submission.findById(params.id).select("notes agencyId");
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const userRole = (session.user as any)?.role || "agency_admin";
    const agencyId = (session.user as any)?.agencyId;

    if (
      userRole !== "system_admin" &&
      agencyId !== submission.agencyId.toString()
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        notes: submission.notes || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
