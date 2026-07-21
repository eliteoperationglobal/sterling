import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Quote from "@/models/Quote";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const quoteId = params.id;
    const { doc, value } = await req.json();

    if (!doc || typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return NextResponse.json({ error: `Quote not found: ${quoteId}` }, { status: 404 });
    }

    if (!quote.checkedDocuments) {
      quote.checkedDocuments = new Map();
    }

    const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
    quote.checkedDocuments.set(safeKey, value);
    await quote.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin quote documents update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
