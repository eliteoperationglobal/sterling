import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";
import Submission from "@/models/Submission";
import Carrier from "@/models/Carrier";
import RoutingLog from "@/models/RoutingLog";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";

/**
 * POST /api/admin/quotes
 * Admin creates a quote for a submission
 * Body: { submissionId, carrierId, carrierQuoteUSD }
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

    // Only system_admin can access admin APIs
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { submissionId, carrierId, carrierQuoteUSD } = body;

    // Validate input
    if (!submissionId || !carrierId || !carrierQuoteUSD) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, carrierId, carrierQuoteUSD" },
        { status: 400 }
      );
    }

    if (carrierQuoteUSD <= 0) {
      return NextResponse.json(
        { error: "carrierQuoteUSD must be greater than 0" },
        { status: 400 }
      );
    }

    // Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get carrier
    const carrier = await Carrier.findById(carrierId);
    if (!carrier) {
      return NextResponse.json(
        { error: "Carrier not found" },
        { status: 404 }
      );
    }

    // Check if quote already exists for this submission and carrier
    const existingQuote = await Quote.findOne({
      submissionId,
      carrierId,
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: "Quote already exists for this submission and carrier" },
        { status: 400 }
      );
    }

    // Calculate wholesale fee
    const wholesaleFeePercent = carrier.wholesaleFeePercent;
    const wholesaleFeeAmountUSD = (carrierQuoteUSD * wholesaleFeePercent) / 100;
    const brokerFeeAmountUSD = 0; // Agency will add this later
    const finalAmountUSD = carrierQuoteUSD + wholesaleFeeAmountUSD + brokerFeeAmountUSD;

    // Create quote (admin enters carrier quote)
    const quote = await Quote.create({
      submissionId,
      carrierId,
      carrierQuoteUSD,
      wholesaleFeePercent,
      wholesaleFeeAmountUSD,
      brokerFeeAmountUSD,
      finalAmountUSD,
      status: "ENTERED",
      enteredByAdminId: (session.user as any).id,
      enteredAt: new Date(),
    });

    // Update submission status to QUOTED
    await Submission.findByIdAndUpdate(submissionId, {
      status: "QUOTED",
    });

    // Log activity: Quote created
    await logActivity(
      createActivityLogData(
        "QUOTE_CREATED",
        `Quote created by admin for ${submission.clientContact?.name || "client"}`,
        {
          submissionId: submissionId,
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            carrierName: carrier.name,
            carrierQuoteUSD: carrierQuoteUSD,
            finalAmountUSD: finalAmountUSD,
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      quote: {
        _id: quote._id.toString(),
        submissionId: quote.submissionId.toString(),
        carrierId: quote.carrierId.toString(),
        carrierQuoteUSD: quote.carrierQuoteUSD,
        wholesaleFeePercent: quote.wholesaleFeePercent,
        wholesaleFeeAmountUSD: quote.wholesaleFeeAmountUSD,
        brokerFeeAmountUSD: quote.brokerFeeAmountUSD,
        finalAmountUSD: quote.finalAmountUSD,
        status: quote.status,
        createdAt: quote.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Quote creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/quotes
 * Get all quotes (admin view)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin" && userRole !== "agency_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const quotes = await Quote.find({})
      .populate("submissionId", "clientContact status")
      .populate("carrierId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedQuotes = quotes.map((quote: any) => ({
      _id: quote._id.toString(),
      submissionId: quote.submissionId?._id?.toString() || null,
      carrierId: quote.carrierId?._id?.toString() || null,
      carrierName: quote.carrierId?.name || "N/A",
      clientName: quote.submissionId?.clientContact?.name || "N/A",
      carrierQuoteUSD: quote.carrierQuoteUSD,
      wholesaleFeePercent: quote.wholesaleFeePercent,
      wholesaleFeeAmountUSD: quote.wholesaleFeeAmountUSD,
      brokerFeeAmountUSD: quote.brokerFeeAmountUSD,
      finalAmountUSD: quote.finalAmountUSD,
      status: quote.status,
      createdAt: quote.createdAt,
    }));

    return NextResponse.json({
      quotes: formattedQuotes,
      count: formattedQuotes.length,
    });
  } catch (error: any) {
    console.error("Quotes fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

