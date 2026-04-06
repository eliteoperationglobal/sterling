import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/admin/quotes/[id]/post
 * Admin posts a carrier-approved quote (ENTERED → POSTED)
 * Body: { carrierReference }
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

    // Only system_admin can post quotes
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Import models to ensure they're registered
    await import("@/models/Submission");
    await import("@/models/Agency");

    const body = await req.json();
    const { carrierReference } = body;

    // Get quote with full population
    const quote = await Quote.findById(params.id)
      .populate({
        path: "submissionId",
        populate: {
          path: "agencyId",
          select: "name email",
        },
      });
      
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Only quotes with status ENTERED can be posted
    if (quote.status !== "ENTERED") {
      return NextResponse.json(
        { error: `Quote must be in ENTERED status to be posted. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Post the quote (mark as POSTED)
    const postedQuote = await Quote.findByIdAndUpdate(
      params.id,
      {
        status: "POSTED",
        postedAt: new Date(),
        carrierReference: carrierReference || undefined,
      },
      { new: true }
    )
      .populate({
        path: "submissionId",
        select: "clientContact status agencyId",
        populate: {
          path: "agencyId",
          select: "name email",
        },
      })
      .populate("carrierId", "name email");

    // Log activity: Quote posted
    const submission = postedQuote!.submissionId as any;
    await logActivity(
      createActivityLogData(
        "QUOTE_CREATED",
        `Quote posted by admin for ${submission.clientContact?.name || "client"}`,
        {
          submissionId: submission._id.toString(),
          quoteId: postedQuote!._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            carrierName: (postedQuote!.carrierId as any)?.name,
            finalAmount: postedQuote!.finalAmountUSD,
            carrierReference: carrierReference,
          },
        }
      )
    );

    // Send email notification to agency
    try {
      const EmailService = (await import("@/services/EmailService")).default;
      const submission = postedQuote!.submissionId as any;
      const agency = submission.agencyId;
      
      if (agency && agency.email) {
        await EmailService.sendQuotePostedNotification(
          agency.email,
          agency.name,
          submission.clientContact?.name || "Client",
          postedQuote!._id.toString()
        );
      }
    } catch (emailError: any) {
      console.error("Failed to send agency notification:", emailError.message);
      // Don't fail the quote posting if email fails
    }

    return NextResponse.json({
      success: true,
      quote: {
        _id: postedQuote!._id.toString(),
        submissionId: postedQuote!.submissionId._id.toString(),
        carrierId: postedQuote!.carrierId._id.toString(),
        carrierName: (postedQuote!.carrierId as any).name,
        clientName: (postedQuote!.submissionId as any).clientContact?.name || "N/A",
        carrierQuoteUSD: postedQuote!.carrierQuoteUSD,
        wholesaleFeePercent: postedQuote!.wholesaleFeePercent,
        wholesaleFeeAmountUSD: postedQuote!.wholesaleFeeAmountUSD,
        brokerFeeAmountUSD: postedQuote!.brokerFeeAmountUSD,
        finalAmountUSD: postedQuote!.finalAmountUSD,
        status: postedQuote!.status,
        carrierReference: postedQuote!.carrierReference,
        postedAt: postedQuote!.postedAt,
        createdAt: postedQuote!.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Quote post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post quote" },
      { status: 500 }
    );
  }
}




