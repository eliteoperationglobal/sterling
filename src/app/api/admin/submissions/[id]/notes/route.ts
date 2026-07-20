import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Agency from "@/models/Agency";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * PATCH /api/admin/submissions/[id]/notes
 * Admin adds or updates notes on a submission
 * Body: { adminNotes: string }
 */
export async function PATCH(
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

    // Only system_admin can add notes
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { adminNotes } = body;

    // Find submission
    const submission = await Submission.findById(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Update admin notes
    submission.adminNotes = adminNotes || "";
    await submission.save();

    // Log activity: Admin note added
    await logActivity(
      createActivityLogData(
        "ADMIN_NOTE_ADDED",
        `Admin notes ${adminNotes ? "updated" : "cleared"} on submission`,
        {
          submissionId: submission._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            hasNotes: !!adminNotes,
            noteLength: adminNotes?.length || 0,
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      submission: {
        _id: submission._id.toString(),
        adminNotes: submission.adminNotes,
        updatedAt: submission.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update admin notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin notes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/submissions/[id]/notes
 * Admin adds an individual note to the activity log
 * Body: { note: string, notifyList: string[] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only system_admin can add notes
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    const { note, notifyList } = await req.json();

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const submission = await Submission.findById(params.id);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const userEmail = (session.user as any).email || "unknown@admin.com";
    const userName = (session.user as any).name || "Admin User";

    const logData = createActivityLogData(
      "ADMIN_NOTE_ADDED",
      note,
      {
        submissionId: params.id,
        user: {
          id: (session.user as any).id,
          name: userName,
          email: userEmail,
          role: userRole,
        },
        details: {
          notifyList: notifyList || [],
          source: "admin_portal"
        },
      }
    );

    await logActivity(logData);

    // ==========================================
    // EMAIL NOTIFICATION BLOCK
    // Wrapped in a try-catch to ensure 101% safety
    // ==========================================
    try {
      const { sendAdminNoteToBroker } = await import("@/lib/services/email/EmailService");
      
      const agency = await Agency.findById(submission.agencyId);
      const agentName = submission.agentName || "";
      let resolvedBrokerEmail = agency?.email || submission.clientContact?.email || "";
      
      // Capco exact mapping
      const capcoAgentEmails: Record<string, string> = {
        "Eidan Gamaty": "Eidan@capcoinsurance.com",
        "Moshe Gamaty": "Moshe.g@capcoinsurance.com",
        "Michael Gamaty": "Michael@capcoinsurance.com",
        "Yoav Anatian": "Joe@capcoinsurance.com",
        "Jake Weiner": "Jake@capcoinsurance.com",
        "Benjamin Solender": "Ben@capcoinsurance.com",
        "Michal Kraut": "Michal@capcoinsurance.com",
        "Jonathan Akwa": "Jonathan@capcoinsurance.com",
      };

      if (agentName && capcoAgentEmails[agentName]) {
        resolvedBrokerEmail = capcoAgentEmails[agentName];
      }

      if (resolvedBrokerEmail) {
        await sendAdminNoteToBroker({
          brokerEmail: resolvedBrokerEmail,
          brokerName: agentName || agency?.name || "Broker",
          companyName: submission.payload?.companyName || submission.clientContact?.name || "Unknown Company",
          adminName: userName,
          noteContent: note,
          submissionId: submission._id.toString()
        });
        console.log(`✅ Note email sent to broker/agent: ${resolvedBrokerEmail}`);
      }
    } catch (emailError: any) {
      console.error("❌ Note email send error:", emailError);
      // We explicitly swallow this error so the route still succeeds
    }
    // ==========================================

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

