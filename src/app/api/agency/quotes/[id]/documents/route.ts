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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const quoteId = params.id;
    const { doc, value } = await req.json();

    const quote = await Quote.findById(quoteId).populate('submissionId');
    if (!quote) {
      return NextResponse.json({ error: `Quote not found: ${quoteId}` }, { status: 404 });
    }

    // Check if the quote's submission belongs to the agency
    if ((quote.submissionId as any).agencyId.toString() !== (session.user as any).agencyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Initialize checkedDocuments if not exists
    if (!quote.checkedDocuments) {
      quote.checkedDocuments = new Map();
    }

    // update map
    const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
    quote.checkedDocuments.set(safeKey, value);
    quote.markModified('checkedDocuments');

    await quote.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}