import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ESignService } from "@/lib/services/esign";

/**
 * POST /api/esign/webhook
 * Handle e-signature webhook (for mock mode and future provider integration)
 * Body: { submissionId, documentType?, status?, envelopeId? }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { submissionId, documentType, status, envelopeId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    // Call ESignService to handle webhook
    const result = await ESignService.handleWebhook({
      submissionId,
      documentType,
      status: status || "SIGNED",
      envelopeId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to handle webhook" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      allSigned: result.allSigned,
      esignCompleted: result.esignCompleted,
      message: result.esignCompleted
        ? "All documents signed. E-signature completed!"
        : result.allSigned
        ? "All documents signed, but e-signature not yet completed"
        : "Document signature updated",
    });
  } catch (error: any) {
    console.error("E-sign webhook API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to handle webhook" },
      { status: 500 }
    );
  }
}



