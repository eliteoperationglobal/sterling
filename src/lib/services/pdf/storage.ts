import { uploadToS3 } from "@/lib/s3";

/**
 * Save PDF buffer to storage and return URL
 * @param pdfBuffer - PDF file buffer
 * @param filename - Desired filename
 * @returns URL path to the saved PDF
 */
export async function savePDFToStorage(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log("📄 [STORAGE] Starting PDF save process...");
    console.log(`📄 [STORAGE] Filename: ${filename}`);
    console.log(`📄 [STORAGE] Buffer size: ${pdfBuffer.length} bytes`);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
    const key = `documents/${uniqueFilename}`;

    console.log(`📄 [STORAGE] Unique filename: ${uniqueFilename}`);
    console.log(`📄 [STORAGE] S3 Key: ${key}`);

    // Save PDF file to S3
    console.log("📄 [STORAGE] Uploading PDF file to S3...");
    const url = await uploadToS3(pdfBuffer, key, "application/pdf");
    console.log("📄 [STORAGE] ✅ PDF file uploaded successfully");

    console.log(`📄 [STORAGE] Final document URL: ${url}`);

    return url;
  } catch (error: any) {
    console.error("📄 [STORAGE] ❌ Failed to save PDF:", error);
    console.error("📄 [STORAGE] Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`Failed to save PDF: ${error.message}`);
  }
}

