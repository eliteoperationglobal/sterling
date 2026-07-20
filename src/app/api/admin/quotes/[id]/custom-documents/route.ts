import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";

/**
 * PATCH /api/admin/quotes/[id]/custom-documents
 * Updates the customDocuments (Subjective Lines) array for a quote
 * Body: { customDocuments: string[] }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only system_admin can update this
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const quoteId = params.id;
    const { customDocuments } = await req.json();

    if (!Array.isArray(customDocuments)) {
      return NextResponse.json({ error: "Invalid payload, expected array of strings" }, { status: 400 });
    }

    // Filter out any empty strings
    const validDocs = customDocuments.filter((doc) => doc.trim() !== "");

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return NextResponse.json({ error: `Quote not found: ${quoteId}` }, { status: 404 });
    }

    // Update the customDocuments array
    quote.customDocuments = validDocs;
    await quote.save();

    return NextResponse.json({ success: true, customDocuments: validDocs });
  } catch (err: any) {
    console.error("Admin quote custom-documents update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
