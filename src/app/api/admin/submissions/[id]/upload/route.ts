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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const submissionId = params.id;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const bucketName = process.env.B2_BUCKET_NAME || "sterling-uploads";
    const key = `submissions/${submissionId}/${timestamp}-${cleanFileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const fileUrl = `${process.env.B2_ENDPOINT}/${bucketName}/${key}`;

    await connectDB();
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    submission.files.push({
      fieldKey: "admin_document",
      fileUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedAt: new Date(),
    });

    await submission.save();

    return NextResponse.json({ success: true, fileUrl });
  } catch (error: any) {
    console.error("Admin file upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
