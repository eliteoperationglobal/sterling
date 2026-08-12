import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { deleteFromS3, B2_ENDPOINT, B2_BUCKET_NAME } from "@/lib/s3";

function extractKeyFromUrl(url: string): string | null {
  const prefix = `${B2_ENDPOINT}/${B2_BUCKET_NAME}/`;
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length);
  }
  return null;
}

/**
 * DELETE /api/admin/bound-policies/delete-document
 * Deletes a final policy document from S3 and the database.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only system admin can delete documents
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { submissionId, quoteId, documentType } = body;

    if (!submissionId || !documentType) {
      return NextResponse.json(
        { error: "submissionId and documentType are required" },
        { status: 400 }
      );
    }

    if (documentType !== 'certificate' && !quoteId) {
       return NextResponse.json(
         { error: "quoteId is required for binder and policy documents" },
         { status: 400 }
       );
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    let quote = null;
    if (quoteId) {
      quote = await Quote.findById(quoteId);
      if (!quote || quote.submissionId.toString() !== submissionId) {
        return NextResponse.json(
          { error: "Quote not found or does not belong to submission" },
          { status: 404 }
        );
      }
    }

    let fileUrlToDelete: string | undefined;

    if (documentType === 'binder') {
      if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      fileUrlToDelete = quote.binderUrl;
      quote.binderUrl = undefined;
      
      if (quote.policyType === 'GENERAL_LIABILITY') {
        submission.binderUrl = undefined;
        submission.markModified("binderUrl");
      }
    } else if (documentType === 'policy') {
      if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      fileUrlToDelete = quote.policyDocsUrl;
      quote.policyDocsUrl = undefined;
      
      if (quote.policyType === 'GENERAL_LIABILITY') {
        submission.policyDocsUrl = undefined;
        submission.markModified("policyDocsUrl");
      }
    } else if (documentType === 'certificate') {
      fileUrlToDelete = submission.finalPolicyDocuments?.certificateOfInsuranceUrl;
      if (submission.finalPolicyDocuments) {
        submission.finalPolicyDocuments.certificateOfInsuranceUrl = undefined;
        submission.markModified("finalPolicyDocuments");
      }
    } else {
      return NextResponse.json(
        { error: "Invalid documentType" },
        { status: 400 }
      );
    }

    if (!fileUrlToDelete) {
       return NextResponse.json(
        { error: "Document not found or already deleted" },
        { status: 404 }
      );
    }

    // Attempt to delete from S3
    const key = extractKeyFromUrl(fileUrlToDelete);
    if (key) {
      try {
        await deleteFromS3(key);
        console.log(`✅ Deleted file from S3: ${key}`);
      } catch (s3Error) {
        console.error(`Failed to delete file from S3: ${key}`, s3Error);
        // We continue to delete from DB even if S3 delete fails (e.g., file not found in S3)
      }
    } else {
       console.warn(`Could not extract S3 key from URL: ${fileUrlToDelete}`);
    }

    await Promise.all([
      submission.save(),
      quote ? quote.save() : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
