import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const s3Client = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APPLICATION_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const isLocalTest = process.env.NODE_ENV === "development" && req.headers.get("x-test-bypass") === "true";

    if (!session || !session.user) {
      if (!isLocalTest) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Extract Data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const submissionId = formData.get("submissionId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!submissionId) {
      return NextResponse.json({ error: "No submissionId provided" }, { status: 400 });
    }

    // 3. File Size Validation (<= 10MB)
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_MB}MB limit` },
        { status: 400 }
      );
    }

    // 4. Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Build S3 Path and Upload
    const { uploadToS3 } = await import("@/lib/s3");

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Folder Structure: submissions/{submissionId}/timestamp-filename.ext
    const key = `submissions/${submissionId}/${timestamp}-${cleanFileName}`;

    const fileUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

    // 7. Save fileUrl into MongoDB submission.files array securely on the server
    await connectDB();
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    submission.files.push({
      fieldKey: "document",
      fileUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedAt: new Date(),
    });

    await submission.save();

    return NextResponse.json({ fileUrl });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Backblaze B2" },
      { status: 500 }
    );
  }
}
