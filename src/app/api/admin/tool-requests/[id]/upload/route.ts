import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ToolRequest from "@/models/ToolRequest";
import { sendEmail } from "@/lib/services/email/EmailService";
import { promises as fs } from "fs";
import path from "path";

/**
 * POST /api/admin/tool-requests/[id]/upload
 * Upload result document for a tool request
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

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Fetch the request
    const request = await ToolRequest.findById(params.id).populate("agencyId", "name email");

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Create upload directory if it doesn't exist
    const { uploadToS3 } = await import("@/lib/s3");

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `result-${request._id}-${timestamp}${fileExtension}`;

    // Save file to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = `tool-results/${request._id}/${fileName}`;
    const documentUrl = await uploadToS3(buffer, key, file.type || "application/pdf");

    console.log(`✅ File saved to S3: ${fileName}`);

    // Update request with document URL
    request.resultDocumentUrl = documentUrl;
    request.status = "COMPLETED"; // Auto-complete when document is uploaded
    request.processedBy = (session.user as any).id;
    request.processedAt = new Date();
    await request.save();

    console.log(`✅ Tool request ${params.id} marked as COMPLETED with result document`);

    // ❌ DISABLED: Agency email stopped per business decision
    // Only broker (#4 sendQuoteToBroker) and 2FA (#7) emails are active.
    // try {
    //   await sendEmail({
    //     to: (request.agencyId as any).email,
    //     subject: `Tool Request Completed: ${requestTypeLabels[request.requestType] || "Tool Request"}`,
    //     html: `
    //       <h2>Your Tool Request is Ready!</h2>
    //       <p><strong>Request Type:</strong> ${requestTypeLabels[request.requestType] || request.requestType}</p>
    //       <p><strong>Client:</strong> ${request.clientName}</p>
    //       <p><strong>Status:</strong> COMPLETED</p>
    //       <p>Your requested document is now available for download in your agency portal.</p>
    //       <p>Please log in to your agency portal to download the result.</p>
    //     `,
    //     text: `Your tool request for ${request.clientName} is completed and ready for download`,
    //   });
    //   console.log("📧 Completion email sent to agency");
    // } catch (emailError) {
    //   console.error("Email notification error:", emailError);
    // }

    return NextResponse.json({
      success: true,
      documentUrl,
      message: "Document uploaded successfully",
    });
  } catch (error: any) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

