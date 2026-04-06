import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import { ESignService } from "@/lib/services/esign";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import Quote from "@/models/Quote";

/**
 * POST /api/esign/send
 * Send documents for e-signature
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

    await connectDB();

    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    // Call ESignService to send for signature
    const result = await ESignService.sendForSignature(submissionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send documents for signature" },
        { status: 400 }
      );
    }

    // Get quote ID if available
    const quote = await Quote.findOne({ submissionId }).lean();
    const quoteId = quote?._id?.toString();

    // Log activity: Documents sent for e-signature
    await logActivity(
      createActivityLogData(
        "DOCUMENT_GENERATED",
        `Documents sent for e-signature`,
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
            envelopeId: result.envelopeId,
            documentsSent: result.documentsSent,
            signingUrl: result.signingUrl,
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      signingUrl: result.signingUrl,
      envelopeId: result.envelopeId,
      documentsSent: result.documentsSent,
      message: `${result.documentsSent} document(s) sent for signature`,
    });
  } catch (error: any) {
    console.error("E-sign send API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send documents for signature" },
      { status: 500 }
    );
  }
}



