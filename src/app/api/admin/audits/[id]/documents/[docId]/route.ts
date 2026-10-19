import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, docId: string } }
) {
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

    await connectDB();
    const { id, docId } = params;

    const audit = await Audit.findById(id).populate("submissionId");
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // 101% Multi-tenant security check:
    if (!isAdmin) {
      const auditAgencyId = audit.agencyId ? String(audit.agencyId) : null;
      const subAgencyId = (audit.submissionId as any)?.agencyId ? String((audit.submissionId as any).agencyId) : null;
      if (auditAgencyId !== userAgencyId && subAgencyId !== userAgencyId) {
        return NextResponse.json({ error: "Forbidden: You do not have access to delete documents from this audit" }, { status: 403 });
      }
    }

    // 1. Find the document to get the fileUrl
    const docToDelete = audit.documents.find((doc: any) => doc.documentId === docId || doc._id?.toString() === docId);
    if (!docToDelete) {
      return NextResponse.json({ error: "Document not found in database" }, { status: 404 });
    }

    // 2. Delete from B2 / S3
    if (docToDelete.fileUrl) {
      try {
        const urlObj = new URL(docToDelete.fileUrl);
        const pathParts = urlObj.pathname.split('/');
        // Format is usually /<bucket>/<key>
        pathParts.shift(); // remove empty string before first slash
        pathParts.shift(); // remove bucket name
        const key = decodeURIComponent(pathParts.join('/'));
        
        const { deleteFromS3 } = await import("@/lib/s3");
        await deleteFromS3(key);
      } catch (s3Err) {
        console.error("Failed to delete from S3 (continuing with DB deletion):", s3Err);
      }
    }

    // 3. Remove document from audit
    audit.documents = audit.documents.filter((doc: any) => doc.documentId !== docId && doc._id?.toString() !== docId);

    // If no documents with fileUrl remain and status was DOCS_RECEIVED, revert to REQUESTED
    const hasRemainingFiles = audit.documents.some((d: any) => !!d.fileUrl);
    if (!hasRemainingFiles && audit.status === "DOCS_RECEIVED") {
      audit.status = "REQUESTED";
    }

    await audit.save();

    // Log the deletion activity
    const AuditActivity = (await import("@/models/AuditActivity")).default;
    await AuditActivity.create({
      auditId: audit._id,
      user: session.user.name || (isAdmin ? "Admin" : "Agency User"),
      role: isAdmin ? "System Admin" : "Agency",
      activity: "Document Deleted",
      details: `Removed document: ${docToDelete.fileName || docToDelete.name || "document"}`
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully", audit });
  } catch (error: any) {
    console.error("Admin document delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string, docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const isAdmin = userRole === "system_admin";

    // Only system admins can verify or change document status
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const { id, docId } = params;
    const body = await req.json();
    const { status } = body;

    const audit = await Audit.findById(id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const doc = audit.documents.find((d: any) => d.documentId === docId || d._id?.toString() === docId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (status) {
      doc.status = status;
      if (status === "VERIFIED") {
        doc.verifiedAt = new Date();
      }
    }

    await audit.save();

    const AuditActivity = (await import("@/models/AuditActivity")).default;
    await AuditActivity.create({
      auditId: audit._id,
      user: session.user.name || "Admin",
      role: "System Admin",
      activity: "Document Verified",
      details: `Document "${doc.fileName || doc.name}" marked as ${status}`
    });

    return NextResponse.json({ success: true, audit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update document" }, { status: 500 });
  }
}

