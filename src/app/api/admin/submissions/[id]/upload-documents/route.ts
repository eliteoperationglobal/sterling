import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * POST /api/admin/submissions/[id]/upload-documents
 * Admin-only endpoint to upload one or more supporting documents
 * for a submission. Files are stored on disk and tracked in
 * Submission.signedDocuments as documentType: "ADMIN_UPLOAD".
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

    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // We will use our new S3 helper
    const { uploadToS3 } = await import("@/lib/s3");

    const uploaded: Array<{
      documentName: string;
      documentUrl: string;
    }> = [];

    // Ensure files array exists for legacy document listing on agency side
    if (!Array.isArray(submission.files)) {
      submission.files = [];
    }

    for (const file of files) {
      // Basic type/size guard; allow common docs but keep under 20MB
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 20MB)` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `admin-doc-${params.id}-${Date.now()}-${safeName}`;
      const key = `submissions/${params.id}/admin-documents/${fileName}`;

      const documentUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

      // Store in legacy files array so agency submission page table can show it
      submission.files.push({
        fieldKey: "admin_upload",
        fileUrl: documentUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        uploadedAt: new Date(),
      });

      submission.signedDocuments.push({
        documentType: "ADMIN_UPLOAD",
        documentName: file.name,
        documentUrl,
        generatedAt: new Date(),
        signatureStatus: "GENERATED",
      });

      uploaded.push({
        documentName: file.name,
        documentUrl,
      });
    }

    submission.markModified("signedDocuments");
    await submission.save();

    return NextResponse.json({
      success: true,
      uploadedCount: uploaded.length,
      documents: uploaded,
    });
  } catch (error: any) {
    console.error("Admin upload documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload documents" },
      { status: 500 }
    );
  }
}

