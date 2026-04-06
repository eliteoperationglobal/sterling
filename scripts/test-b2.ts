import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local variables
dotenv.config({ path: ".env.local" });

const s3Client = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APPLICATION_KEY || "",
  },
});

async function testUpload() {
  try {
    console.log("Starting B2 Upload Test...");

    const fileContent = Buffer.from("This is a sample file to test Backblaze B2 Upload.");
    const fileName = "test-upload.txt";
    const bucketName = process.env.B2_BUCKET_NAME || "sterling-uploads";
    const timestamp = Date.now();
    const key = `submissions/test/${timestamp}-${fileName}`;

    console.log(`Uploading ${fileName} to bucket: ${bucketName}...`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: "text/plain",
      })
    );

    const fileUrl = `${process.env.B2_ENDPOINT}/${bucketName}/${key}`;
    console.log("✅ Upload Successful!");
    console.log("📄 Returned File URL:", fileUrl);
    
  } catch (error) {
    console.error("❌ Upload Failed!");
    console.error(error);
  }
}

testUpload();
