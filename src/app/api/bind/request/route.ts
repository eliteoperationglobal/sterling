import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { BindService } from "@/lib/services/bind";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import Quote from "@/models/Quote";

/**
 * POST /api/bind/request
 * Request bind for a submission
 * Body: { submissionId }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agency users can request bind
    const userRole = (session.user as any).role;
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: "Forbidden - Agency access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify submission exists and belongs to user's agency
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify submission belongs to user's agency
    const userAgencyId = (session.user as any).agencyId;
    if (submission.agencyId.toString() !== userAgencyId) {
      return NextResponse.json(
        { error: "Forbidden - Submission does not belong to your agency" },
        { status: 403 }
      );
    }

    // Use BindService to handle the bind request logic
    const result = await BindService.requestBind(submissionId);

    // Get quote ID if available
    const quote = await Quote.findOne({ submissionId }).lean();
    const quoteId = quote?._id?.toString();

    // Log activity: Bind requested
    await logActivity(
      createActivityLogData(
        "BIND_REQUESTED",
        `Bind requested for submission`,
        {
          submissionId: submissionId,
          quoteId: quoteId,
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "agency",
          },
          details: {
            clientName: submission.clientContact?.name,
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      message: "Bind request submitted successfully.",
    });
  } catch (error: any) {
    console.error("Bind request API error:", error);
    
    // Return specific error message for validation failures
    const errorMessage = error.message || "Failed to request bind";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { 
        status: errorMessage.includes("not found") 
          ? 404 
          : errorMessage.includes("must be completed") 
          ? 400 
          : 400 
      }
    );
  }
}

