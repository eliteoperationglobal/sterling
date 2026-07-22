import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const fileUrl = searchParams.get("fileUrl");

        if (!fileUrl) {
            return NextResponse.json({ error: "No fileUrl provided" }, { status: 400 });
        }

        await connectDB();
        
        const submission = await Submission.findById(params.id);
        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Only allow agency users to delete their own documents, admin can delete any
        const userRole = (session.user as any).role;
        const agencyId = (session.user as any).agencyId;
        
        if (userRole !== "system_admin" && submission.agencyId.toString() !== agencyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Find the file in the submission
        const fileIndex = submission.files.findIndex((f: any) => f.fileUrl === fileUrl);
        if (fileIndex === -1) {
            return NextResponse.json({ error: "File not found in submission" }, { status: 404 });
        }

        // Remove from DB
        submission.files.splice(fileIndex, 1);
        await submission.save();

        // Attempt to delete from S3
        try {
            // fileUrl format: https://.../bucket-name/submissions/...
            // we need to extract the key part. It's everything after bucket-name/
            const urlObj = new URL(fileUrl);
            const pathParts = urlObj.pathname.split('/');
            // The pathname might be /sterling-uploads/submissions/123/456-file.pdf
            // Backblaze B2 public URL: https://s3.us-west-004.backblazeb2.com/sterling-uploads/submissions/...
            const bucketName = process.env.B2_BUCKET_NAME || "sterling-uploads";
            
            let key = "";
            const bucketIndex = pathParts.indexOf(bucketName);
            if (bucketIndex !== -1) {
                key = pathParts.slice(bucketIndex + 1).join('/');
            } else {
                // If bucket name isn't in the URL path (e.g. custom domain), fallback to extracting 'submissions/...'
                const subIndex = pathParts.indexOf('submissions');
                if (subIndex !== -1) {
                    key = pathParts.slice(subIndex).join('/');
                }
            }

            if (key) {
                // S3 keys must be decoded as URLs often encode spaces as %20
                const decodedKey = decodeURIComponent(key);
                await deleteFromS3(decodedKey);
                console.log(`Deleted S3 key: ${decodedKey}`);
            } else {
                console.warn(`Could not extract S3 key from URL: ${fileUrl}`);
            }
        } catch (s3Error) {
            console.error("Failed to delete file from S3:", s3Error);
            // We don't fail the request if S3 deletion fails, as the DB record is already gone
        }

        return NextResponse.json({ message: "Document deleted successfully" });
    } catch (error: any) {
        console.error("Delete document error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}