import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { PDFService } from "@/lib/services/pdf";

/**
 * POST /api/documents/generate-carrier-forms
 * Generate Carrier Forms PDF for a submission
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

    // Ensure models are registered
    await import("@/models/Carrier");
    await import("@/models/Agency");

    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    // Validate submission exists
    const submission = await Submission.findById(submissionId).lean();
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Find quote for this submission
    const quote = await Quote.findOne({ submissionId }).lean();
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found for this submission" },
        { status: 404 }
      );
    }

    // Check if quote is approved
    if (quote.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Quote must be approved before generating documents" },
        { status: 400 }
      );
    }

    // Generate carrier forms PDF using PDFService
    console.log(`📋 [API] Generating Carrier Forms PDF for submission ${submissionId}`);
    console.log(`📋 [API] Quote ID: ${quote._id}`);
    
    const result = await PDFService.generateDocument({
      quoteId: quote._id.toString(),
      documentType: "CARRIER_FORM",
    });

    if (!result.success) {
      console.error(`📋 [API] ❌ PDF generation failed: ${result.error}`);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to generate carrier forms PDF" 
        },
        { status: 500 }
      );
    }

    console.log(`📋 [API] ✅ Carrier Forms PDF generated successfully for submission ${submissionId}`);
    console.log(`📋 [API] Document URL: ${result.documentUrl}`);

    return NextResponse.json({
      success: true,
      documentUrl: result.documentUrl,
      documentName: result.documentName,
    });
  } catch (error: any) {
    console.error("📋 [API] ❌ Generate carrier forms error:", error);
    console.error("📋 [API] Error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to generate carrier forms PDF" 
      },
      { status: 500 }
    );
  }
}

