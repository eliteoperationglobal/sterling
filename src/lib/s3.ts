import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.B2_REGION || "us-west-004",
    endpoint: process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com",
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || "",
        secretAccessKey: process.env.B2_APPLICATION_KEY || "",
    },
});

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || "sterling-uploads";
export const B2_ENDPOINT = process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com";

/**
 * Uploads a buffer to Backblaze B2 (S3 API).
 * @param buffer - File content as Buffer
 * @param key - The destination key (path) inside the bucket
 * @param contentType - The MIME type of the file
 * @returns The resulting public file URL
 */
export async function uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string = "application/octet-stream"
): Promise<string> {
    await s3Client.send(
        new PutObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );
    return `${B2_ENDPOINT}/${B2_BUCKET_NAME}/${key}`;
}

/**
 * Deletes a file from Backblaze B2 (S3 API).
 * @param key - The destination key (path) inside the bucket
 */
export async function deleteFromS3(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: key,
        })
    );
}