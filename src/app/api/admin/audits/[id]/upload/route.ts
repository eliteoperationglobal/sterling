import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let currentStep = "initializing";
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    currentStep = "parsing form data";
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const auditId = params.id;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    currentStep = "preparing file buffer";
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `audits/${auditId}/${timestamp}-${cleanFileName}`;

    currentStep = "uploading to S3/B2";
    const { uploadToS3 } = await import("@/lib/s3");
    const fileUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

    currentStep = "connecting to database";
    await connectDB();
    
    currentStep = "finding audit record";
    const audit = await Audit.findById(auditId);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    currentStep = "saving to database";
    audit.documents.push({
      documentId: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: file.name,
      fileName: file.name,
      fileUrl: fileUrl,
      status: "RECEIVED",
      uploadedAt: new Date(),
      uploadedBy: session.user.name || "Admin",
    });

    await audit.save();

    return NextResponse.json({ success: true, fileUrl, audit });
  } catch (error: any) {
    console.error("Admin audit file upload error:", error);
    return NextResponse.json(
      { 
        error: `Failed during: ${currentStep} - ${error.message || "Timeout"}`,
        details: String(error),
        name: error.name
      },
      { status: 500 }
    );
  }
}
