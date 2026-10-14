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
    const isAdmin = userRole === "system_admin";
    const userAgencyId = (session.user as any).agencyId ? String((session.user as any).agencyId) : null;

    if (!isAdmin && !userAgencyId) {
      return NextResponse.json({ error: "Forbidden: No associated agency found" }, { status: 403 });
    }

    currentStep = "parsing form data";
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const auditId = params.id;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    currentStep = "connecting to database and verifying audit";
    await connectDB();
    const audit = await Audit.findById(auditId).populate("submissionId");
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // 101% Multi-tenant security check:
    if (!isAdmin) {
      const auditAgencyId = audit.agencyId ? String(audit.agencyId) : null;
      const subAgencyId = (audit.submissionId as any)?.agencyId ? String((audit.submissionId as any).agencyId) : null;
      if (auditAgencyId !== userAgencyId && subAgencyId !== userAgencyId) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this audit" }, { status: 403 });
      }
    }

    currentStep = "preparing file buffer";
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `audits/${auditId}/${timestamp}-${cleanFileName}`;

    currentStep = "uploading to S3/B2";
    const { uploadToS3 } = await import("@/lib/s3");
    const fileUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

    currentStep = "saving to database";
    const targetDocId = formData.get("documentId") as string | null;
    let targetDoc: any = null;

    if (targetDocId) {
      targetDoc = audit.documents.find((d: any) => d.documentId === targetDocId || d._id?.toString() === targetDocId);
    }

    if (targetDoc) {
      targetDoc.fileName = file.name;
      targetDoc.fileUrl = fileUrl;
      targetDoc.status = "RECEIVED";
      targetDoc.uploadedAt = new Date();
      targetDoc.uploadedBy = session.user.name || (isAdmin ? "Admin" : "Agency User");
    } else {
      audit.documents.push({
        documentId: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        fileName: file.name,
        fileUrl: fileUrl,
        status: "RECEIVED",
        uploadedAt: new Date(),
        uploadedBy: session.user.name || (isAdmin ? "Admin" : "Agency User"),
      });
    }

    // Auto-advance workflow status from REQUESTED to DOCS_RECEIVED
    let statusChanged = false;
    if (audit.status === "REQUESTED") {
      audit.status = "DOCS_RECEIVED";
      statusChanged = true;
    }

    await audit.save();

    // Log the upload activity
    const AuditActivity = (await import("@/models/AuditActivity")).default;
    await AuditActivity.create({
      auditId: audit._id,
      user: session.user.name || (isAdmin ? "Admin" : "Agency User"),
      role: isAdmin ? "System Admin" : "Agency",
      activity: "Document Uploaded",
      details: targetDoc
        ? `Uploaded document for requirement: ${targetDoc.name || file.name}`
        : `Uploaded supporting document: ${file.name}`
    });

    if (statusChanged) {
      await AuditActivity.create({
        auditId: audit._id,
        user: session.user.name || (isAdmin ? "Admin" : "Agency User"),
        role: isAdmin ? "System Admin" : "Agency",
        activity: "Status Changed",
        details: "Status changed to DOCS_RECEIVED after document upload"
      });
    }

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
