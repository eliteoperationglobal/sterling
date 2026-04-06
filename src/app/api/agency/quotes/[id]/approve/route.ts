import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/agency/quotes/[id]/approve
 * Agency approves a POSTED quote
 * Only agency users can approve
 * Quote must be in POSTED status
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

    // Only agency users can approve quotes
    const userRole = (session.user as any).role;
    console.log("🔍 Approve Quote - User Role:", userRole);
    console.log("🔍 Approve Quote - Full Session:", JSON.stringify(session.user));
    
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: `Forbidden - Agency access required. Your role is: ${userRole}` },
        { status: 403 }
      );
    }

    await connectDB();

    const quoteId = params.id;

    // Find the quote
    const quote = await Quote.findById(quoteId)
      .populate({
        path: "submissionId",
        select: "agencyId clientContact",
      });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Verify the quote belongs to the user's agency
    const submission = quote.submissionId as any;
    const userAgencyId = (session.user as any).agencyId;

    if (submission.agencyId.toString() !== userAgencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Check if quote is in POSTED status
    if (quote.status !== "POSTED") {
      return NextResponse.json(
        { error: `Quote must be in POSTED status to approve. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update quote status to APPROVED
    quote.status = "APPROVED";
    quote.approvedAt = new Date();
    quote.approvedByUserId = (session.user as any).id;
    await quote.save();

    // Log activity: Quote approved
    await logActivity(
      createActivityLogData(
        "QUOTE_APPROVED",
        `Quote approved by agency`,
        {
          submissionId: submission._id.toString(),
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "agency",
          },
          details: {
            clientName: submission.clientContact?.name,
            finalAmount: quote.finalAmountUSD,
          },
        }
      )
    );

    console.log(`✅ Quote ${quoteId} approved by agency user ${(session.user as any).id}`);
    console.log(`📧 Mock notification: Agency approved quote for ${submission.clientContact?.name}`);

    // Populate for response
    const populatedQuote = await Quote.findById(quote._id)
      .populate("carrierId", "name email")
      .populate("submissionId", "clientContact status")
      .lean();

    return NextResponse.json({
      success: true,
      quote: populatedQuote,
      message: "Quote approved successfully. You can now set up finance options.",
    });
  } catch (error: any) {
    console.error("Quote approval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve quote" },
      { status: 500 }
    );
  }
}

