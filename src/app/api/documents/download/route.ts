import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * API endpoint to download PDF documents
 * GET /api/documents/download?path=/documents/filename.pdf
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file path from query parameter
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    // Security: Only allow paths starting with /documents/ or /uploads/
    if (!filePath.startsWith("/documents/") && !filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Remove leading slash and construct full path
    const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const fullPath = join(process.cwd(), "public", relativePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(fullPath);
    const filename = relativePath.split("/").pop() || "document.pdf";

    // Determine content type
    const contentType = filename.endsWith(".pdf")
      ? "application/pdf"
      : "application/octet-stream";

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error serving document:", error);
    return NextResponse.json(
      { error: "Failed to serve document", details: error.message },
      { status: 500 }
    );
  }
}






