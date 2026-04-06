import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import PaymentService from "@/services/PaymentService";
import Quote from "@/models/Quote";

/**
 * POST /api/payments
 * Create a new payment for a quote
 * Body: { quoteId, paymentType, amountUSD, paymentMethod?, financePlanId? }
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

    // Only agency users can make payments
    const userRole = (session.user as any).role;
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: "Forbidden - Agency access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { quoteId, paymentType, amountUSD, paymentMethod, financePlanId } = body;

    // Validate input
    if (!quoteId || !paymentType || !amountUSD) {
      return NextResponse.json(
        { error: "Missing required fields: quoteId, paymentType, amountUSD" },
        { status: 400 }
      );
    }

    if (amountUSD <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify quote exists and is approved
    await import("@/models/Submission");
    const quote = await Quote.findById(quoteId).populate("submissionId", "agencyId");
    
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    if (quote.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Quote must be approved before payment" },
        { status: 400 }
      );
    }

    // Verify quote belongs to user's agency
    const submissionRef = quote.submissionId as any;
    const userAgencyId = (session.user as any).agencyId;

    if (submissionRef.agencyId.toString() !== userAgencyId) {
      return NextResponse.json(
        { error: "Forbidden - Quote does not belong to your agency" },
        { status: 403 }
      );
    }

    // Get full submission document to check e-signature status
    const Submission = (await import("@/models/Submission")).default;
    const submission = await Submission.findById(submissionRef._id);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // ✅ CRITICAL: Check if e-signature is completed
    if (!submission.esignCompleted) {
      return NextResponse.json(
        {
          success: false,
          message: "E-Signature must be completed before payment.",
          error: "E-Signature must be completed before payment.",
        },
        { status: 400 }
      );
    }

    // Create payment
    const paymentResult = await PaymentService.createPayment({
      quoteId,
      agencyId: userAgencyId,
      userId: (session.user as any).id,
      paymentType,
      amountUSD,
      paymentMethod: paymentMethod || "MOCK",
      financePlanId,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Failed to create payment" },
        { status: 500 }
      );
    }

    // If payment is completed, update submission and quote status
    // This applies to both FULL and DOWN_PAYMENT types
    if (paymentResult.status === "COMPLETED") {
      // ✅ Store payment status in submission
      submission.paymentStatus = "PAID";
      submission.paymentDate = new Date();
      await submission.save();

      // Update quote status to PAYMENT_RECEIVED
      quote.status = "PAYMENT_RECEIVED";
      await quote.save();

      console.log(`✅ Payment completed for quote ${quoteId}`);
      console.log(`   Payment Type: ${paymentType}`);
      console.log(`   Submission paymentStatus: PAID`);
      console.log(`   Submission paymentDate: ${submission.paymentDate}`);
      console.log(`   Quote status: PAYMENT_RECEIVED`);
      
      // Note: Bind Request will be unlocked when paymentStatus = "PAID"
      // and esignCompleted = true (both conditions met)
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentResult.status === "COMPLETED" ? "PAID" : paymentResult.status,
      submissionId: submission._id.toString(),
      payment: {
        id: paymentResult.paymentId,
        status: paymentResult.status,
        clientSecret: paymentResult.clientSecret,
      },
    });
  } catch (error: any) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments?quoteId=xxx
 * Get payment history for a quote
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

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const quoteId = searchParams.get("quoteId");

    if (!quoteId) {
      return NextResponse.json(
        { error: "quoteId parameter required" },
        { status: 400 }
      );
    }

    // Verify access
    await import("@/models/Submission");
    const quote = await Quote.findById(quoteId).populate("submissionId", "agencyId");
    
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const userRole = (session.user as any).role;
    const userAgencyId = (session.user as any).agencyId;
    const submission = quote.submissionId as any;

    // Check access: system_admin or quote belongs to user's agency
    if (userRole !== "system_admin" && submission.agencyId.toString() !== userAgencyId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const payments = await PaymentService.getPaymentHistory(quoteId);

    return NextResponse.json({
      payments,
      count: payments.length,
    });
  } catch (error: any) {
    console.error("Payment history fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}

