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
    const docToDelete = audit.documents.find((doc: any) => doc.documentId === docId);
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

    // 3. Filter out the document with the matching ID
    audit.documents = audit.documents.filter((doc: any) => doc.documentId !== docId);
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
