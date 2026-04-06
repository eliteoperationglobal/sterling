import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import { sendEmail } from "@/lib/services/email/EmailService";

/**
 * POST /api/admin/bound-policies/upload-documents
 * Upload final policy documents for a bound policy
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

    // Only system admin can upload documents
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const formData = await req.formData();
    const submissionId = formData.get("submissionId") as string;
    const quoteId = formData.get("quoteId") as string;
    const policyType = formData.get("policyType") as string || "GENERAL_LIABILITY";
    const finalBinderFile = formData.get("finalBinderPdf") as File | null;
    const finalPolicyFile = formData.get("finalPolicyPdf") as File | null;
    const certificateFile = formData.get("certificate") as File | null;

    if (!submissionId || !quoteId) {
      return NextResponse.json(
        { error: "submissionId and quoteId are required" },
        { status: 400 }
      );
    }

    // Fetch submission
    const submission = await Submission.findById(submissionId).populate("agencyId", "name");

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify submission is bound
    if (!submission.bindApproved || submission.status !== "BOUND") {
      return NextResponse.json(
        { error: "Submission must be bound before uploading final documents" },
        { status: 400 }
      );
    }

    // Fetch Target Quote
    const quote = await Quote.findById(quoteId);
    if (!quote || quote.submissionId.toString() !== submissionId) {
      return NextResponse.json(
        { error: "Quote not found or does not belong to submission" },
        { status: 404 }
      );
    }

    // ✅ ENSURE policyType IS SET ON THE QUOTE
    // If quote doesn't have policyType yet, set it from the request
    if (!quote.policyType) {
      quote.policyType = policyType as 'GENERAL_LIABILITY' | 'EXCESS_LIABILITY';
    }

    // Delete the local mkdir logic
    // We will use our new uploadToS3 helper
    const { uploadToS3 } = await import("@/lib/s3");

    // Initialize finalPolicyDocuments if it doesn't exist to store COI specifically
    if (!submission.finalPolicyDocuments) {
      submission.finalPolicyDocuments = {
        finalBinderPdfUrl: undefined,
        finalPolicyPdfUrl: undefined,
        certificateOfInsuranceUrl: undefined,
      };
    }

    const uploadedFiles: string[] = [];

    // Upload Final Binder PDF
    if (finalBinderFile) {
      const bytes = await finalBinderFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanFileName = finalBinderFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `submissions/${submissionId}/final-documents/binder-${quoteId}-${Date.now()}-${cleanFileName}`;
      const url = await uploadToS3(buffer, key, finalBinderFile.type || "application/pdf");
      quote.binderUrl = url;
      
      // ✅ SYNC TO SUBMISSION LEVEL FOR GL (so download doesn't fall back to old submission URL)
      if (policyType === 'GENERAL_LIABILITY') {
        submission.binderUrl = url;
      }
      uploadedFiles.push("Final Binder PDF");
    }

    // Upload Final Policy PDF
    if (finalPolicyFile) {
      const bytes = await finalPolicyFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanFileName = finalPolicyFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `submissions/${submissionId}/final-documents/policy-${quoteId}-${Date.now()}-${cleanFileName}`;
      const url = await uploadToS3(buffer, key, finalPolicyFile.type || "application/pdf");
      quote.policyDocsUrl = url;
      
      // ✅ SYNC TO SUBMISSION LEVEL FOR GL (so download doesn't fall back to old submission URL)
      if (policyType === 'GENERAL_LIABILITY') {
        submission.policyDocsUrl = url;
      }
      uploadedFiles.push("Final Policy PDF");
    }

    // Upload Certificate of Insurance onto the submission specifically
    if (certificateFile) {
      const bytes = await certificateFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanFileName = certificateFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `submissions/${submissionId}/final-documents/certificate-${Date.now()}-${cleanFileName}`;
      const url = await uploadToS3(buffer, key, certificateFile.type || "application/pdf");
      submission.finalPolicyDocuments.certificateOfInsuranceUrl = url;
      submission.finalPolicyDocuments.certificateUploadedAt = new Date();
      uploadedFiles.push("Certificate of Insurance");
    }

    // Set uploaded by admin ID
    submission.finalPolicyDocuments.uploadedByAdminId = (session.user as any).id;

    // Save submission and quote
    submission.markModified("finalPolicyDocuments");
    // ✅ MARK GL FIELDS AS MODIFIED IF THEY WERE UPDATED
    if (policyType === 'GENERAL_LIABILITY') {
      if (finalBinderFile) submission.markModified("binderUrl");
      if (finalPolicyFile) submission.markModified("policyDocsUrl");
    }
    await Promise.all([
      submission.save(),
      quote.save(),
    ]);

    console.log("✅ Final policy documents uploaded successfully");
    console.log(`   Quote ID: ${quoteId}`);
    console.log(`   Files uploaded: ${uploadedFiles.join(", ")}`);
    console.log(`   Binder URL:`, quote.binderUrl);
    console.log(`   Policy URL:`, quote.policyDocsUrl);

    // Send email notification to agency (mock mode)
    try {
      await sendEmail({
        to: submission.clientContact.email,
        subject: `Final Policy Documents Available - ${submission.clientContact.name}`,
        html: `
          <h2>Final Policy Documents Available</h2>
          <p>Dear ${submission.clientContact.name},</p>
          <p>Your final policy documents have been uploaded and are now available for download.</p>
          <p><strong>Documents uploaded:</strong></p>
          <ul>
            ${uploadedFiles.map(file => `<li>${file}</li>`).join("")}
          </ul>
          <p>Please log in to your portal to download the documents.</p>
          <p>Best regards,<br>Sterling Wholesale Insurance</p>
        `,
        text: `Final policy documents are now available for ${submission.clientContact.name}. Documents: ${uploadedFiles.join(", ")}`,
      });
      console.log("📧 Email notification sent to agency");
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Documents uploaded successfully",
      uploadedFiles,
    });
  } catch (error: any) {
    console.error("Upload documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload documents" },
      { status: 500 }
    );
  }
}

