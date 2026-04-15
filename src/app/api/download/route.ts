export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";

const s3Client = new S3Client({
  region: process.env.B2_REGION || "us-west-004",
  endpoint: process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APPLICATION_KEY || "",
  },
});

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse File URL Request
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");
    const viewMode = searchParams.get("view") === "true";

    if (!rawUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // Normalize URL variants (encoded/decoded/roundtrip)
    const decodedUrl = decodeURIComponent(rawUrl);
    const encodedDecodedUrl = encodeURI(decodedUrl);
    const normalizedUrl = decodedUrl.trim();

    const urlCandidates = Array.from(
      new Set([rawUrl.trim(), decodedUrl, encodedDecodedUrl])
    ).filter((u) => u);

    // 3. Security Check - Verify this file exists in a submission the user has access to
    await connectDB();
    const userRole = (session.user as any).role;

    let submissionQuery: any = {
      $or: [
        { "files.fileUrl": { $in: urlCandidates } },
        { binderUrl: { $in: urlCandidates } },
        { policyDocsUrl: { $in: urlCandidates } },
      ],
    };
    
    // Agencies can only download from their own submissions
    if (userRole === "agency_admin" || userRole === "agency_user") {
      submissionQuery.agencyId = (session.user as any).agencyId;
    } else if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden access." }, { status: 403 });
    }

    const submission = await Submission.findOne(submissionQuery).lean();
    let finalSubmission = submission;
    let foundQuote = null;

    if (!finalSubmission) {
      // Check Quotes if not on top-level Submission
      const quoteQuery: any = {
        $or: [
          { binderUrl: { $in: urlCandidates } },
          { policyDocsUrl: { $in: urlCandidates } },
          { binderPdfUrl: { $in: urlCandidates } },
          { proposalPdfUrl: { $in: urlCandidates } }
        ]
      };
      
      foundQuote = await Quote.findOne(quoteQuery).lean();
      if (foundQuote && foundQuote.submissionId) {
        const subQuery: any = { _id: foundQuote.submissionId };
        if (userRole === "agency_admin" || userRole === "agency_user") {
          subQuery.agencyId = (session.user as any).agencyId;
        }
        finalSubmission = await Submission.findOne(subQuery).lean();
      }
    }

    if (!finalSubmission) {
        return NextResponse.json({ error: "File not found or unauthorized access" }, { status: 404 });
    }

    // 4. Find original File Name from database metadata (including binder/policy docs fallback)
    let fileMeta = finalSubmission.files?.find((f: any) => f.fileUrl === normalizedUrl || f.fileUrl === decodedUrl || f.fileUrl === encodedDecodedUrl);
    let downloadFilename = fileMeta?.fileName;
    let contentType = fileMeta?.mimeType;

    if (!fileMeta) {
      // Check submission root
      if (finalSubmission.binderUrl === normalizedUrl || finalSubmission.binderUrl === decodedUrl || finalSubmission.binderUrl === encodedDecodedUrl) {
        fileMeta = { fileUrl: finalSubmission.binderUrl, fileName: finalSubmission.binderUrl.split('/').pop(), mimeType: 'application/octet-stream' } as any;
      } else if (finalSubmission.policyDocsUrl === normalizedUrl || finalSubmission.policyDocsUrl === decodedUrl || finalSubmission.policyDocsUrl === encodedDecodedUrl) {
        fileMeta = { fileUrl: finalSubmission.policyDocsUrl, fileName: finalSubmission.policyDocsUrl.split('/').pop(), mimeType: 'application/octet-stream' } as any;
      }
      
      // Check Quote child
      if (!fileMeta && foundQuote) {
        if (foundQuote.binderUrl === normalizedUrl || foundQuote.binderUrl === decodedUrl || foundQuote.binderUrl === encodedDecodedUrl || foundQuote.binderPdfUrl === normalizedUrl || foundQuote.binderPdfUrl === decodedUrl || foundQuote.binderPdfUrl === encodedDecodedUrl) {
          fileMeta = { fileUrl: normalizedUrl, fileName: normalizedUrl.split('/').pop(), mimeType: 'application/octet-stream' } as any;
        } else if (foundQuote.policyDocsUrl === normalizedUrl || foundQuote.policyDocsUrl === decodedUrl || foundQuote.policyDocsUrl === encodedDecodedUrl) {
          fileMeta = { fileUrl: normalizedUrl, fileName: normalizedUrl.split('/').pop(), mimeType: 'application/octet-stream' } as any;
        } else if (foundQuote.proposalPdfUrl === normalizedUrl || foundQuote.proposalPdfUrl === decodedUrl || foundQuote.proposalPdfUrl === encodedDecodedUrl) {
          fileMeta = { fileUrl: normalizedUrl, fileName: normalizedUrl.split('/').pop(), mimeType: 'application/octet-stream' } as any;
        }
      }

      if (fileMeta) {
        downloadFilename = fileMeta.fileName;
        contentType = fileMeta.mimeType;
      }
    }

    // Customize filename to include client name
    const clientName = finalSubmission.clientContact?.name || "???";
    
    // Check if it's a known policy doc or binder from either model
    const isBinder = 
      (finalSubmission.binderUrl && urlCandidates.includes(finalSubmission.binderUrl)) || 
      (foundQuote?.binderUrl && urlCandidates.includes(foundQuote.binderUrl)) ||
      (foundQuote?.binderPdfUrl && urlCandidates.includes(foundQuote.binderPdfUrl));
      
    const isPolicyDoc = 
      (finalSubmission.policyDocsUrl && urlCandidates.includes(finalSubmission.policyDocsUrl)) || 
      (foundQuote?.policyDocsUrl && urlCandidates.includes(foundQuote.policyDocsUrl));

    if (isBinder || isPolicyDoc) {
      const extension = downloadFilename?.split('.').pop() || 'pdf';
      const label = isBinder ? "Binder" : "Policy-Docs";
      // Additional clarity for Excess Liability vs General Liability
      let typeLabel = "GL"; // Default to GL
      if (foundQuote?.policyType === "EXCESS_LIABILITY") {
        typeLabel = "Excess";
      }

      // Safe alphanumeric format
      const formattedClientName = clientName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      downloadFilename = `${typeLabel}-${label}-${formattedClientName}.${extension}`;
    }

    downloadFilename = downloadFilename || "downloaded-file";
    contentType = contentType || "application/octet-stream";

    // 5. Intercept local server files vs Backblaze B2
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('/documents/')) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'public', normalizedUrl.split('?')[0]);
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Local file not found" }, { status: 404 });
        }
        
        const fileBuffer = fs.readFileSync(filePath);
        const headers = new Headers();
        const dispositionType = viewMode ? "inline" : "attachment";
        headers.set("Content-Disposition", `${dispositionType}; filename="${downloadFilename}"`);
        headers.set("Content-Type", contentType || "application/pdf");
        headers.set("Content-Length", fileBuffer.length.toString());

        return new NextResponse(fileBuffer, { status: 200, headers });
    }

    const bucketName = process.env.B2_BUCKET_NAME || "sterling-uploads";

    const fileUrlForS3 = (() => {
      try {
        // convert spaces to %20 for URL() and canonical normalization
        const u = new URL(normalizedUrl.includes(" ") ? encodeURI(normalizedUrl) : normalizedUrl);
        return u.toString();
      } catch (err) {
        // fallback to encoded raw and decoded forms
        try {
          return new URL(encodedDecodedUrl).toString();
        } catch (e) {
          return new URL(rawUrl).toString();
        }
      }
    })();

    const urlObj = new URL(fileUrlForS3);
    const keyPrefix = `/${bucketName}/`;
    let key = urlObj.pathname;

    if (key.startsWith(keyPrefix)) {
      key = key.substring(keyPrefix.length);
    } else if (key.startsWith("/")) {
      key = key.substring(1);
    }

    // Ensure key has proper percent encoding for special chars (space, etc.)
    key = decodeURIComponent(key);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const s3Response = await s3Client.send(command);

    // 6. Return Data Stream cleanly mapped to Attachment headers
    // Convert Web Stream to standard Response
    if (!s3Response.Body) {
        throw new Error("Empty body returned from S3");
    }

    const headers = new Headers();
    const dispositionType = viewMode ? "inline" : "attachment";
    headers.set("Content-Disposition", `${dispositionType}; filename="${downloadFilename}"`);
    headers.set("Content-Type", contentType);
    if (s3Response.ContentLength) {
        headers.set("Content-Length", s3Response.ContentLength.toString());
    }

    // We can cast the Node.js Readable stream into a valid Web stream using Next.js utilities
    // As of Next.js 14, standard responses handle ReadableStream directly or iterables!
    return new NextResponse(s3Response.Body as any, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error("Secure File Download Error:", error);
    return NextResponse.json(
      { error: "Failed to securely download file" },
      { status: 500 }
    );
  }
}
