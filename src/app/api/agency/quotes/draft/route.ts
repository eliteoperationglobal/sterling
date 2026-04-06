import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Quote Draft Schema
const quoteDraftSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: String, required: true },
  formData: { type: mongoose.Schema.Types.Mixed, required: true },
  currentStep: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Check if model exists before creating to avoid overwrite error
const QuoteDraft = mongoose.models.QuoteDraft || mongoose.model("QuoteDraft", quoteDraftSchema);

/**
 * POST /api/agency/quotes/draft
 * Auto-save quote draft
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { programId, formData, currentStep } = await req.json();

    if (!programId || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert draft (update if exists, create if not)
    const filter = {
      userId: user.id,
      programId,
    };
    const update = {
      agencyId: user.agencyId,
      userId: user.id,
      programId,
      formData,
      currentStep: currentStep || 1,
      updatedAt: new Date(),
    };
    const options = {
      upsert: true,
      new: true,
    };
    const draft = await (QuoteDraft as any).findOneAndUpdate(filter, update, options);

    return NextResponse.json({
      success: true,
      draftId: draft._id.toString(),
      savedAt: draft.updatedAt,
    });
  } catch (error: any) {
    console.error("Draft save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agency/quotes/draft?programId=xxx
 * Load quote draft
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const searchParams = req.nextUrl.searchParams;
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json(
        { error: "Missing programId" },
        { status: 400 }
      );
    }

    await connectDB();

    const draft = await (QuoteDraft as any).findOne({
      userId: user.id,
      programId,
    }).sort({ updatedAt: -1 });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({
      draft: {
        formData: draft.formData,
        currentStep: draft.currentStep,
        savedAt: draft.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Draft load error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load draft" },
      { status: 500 }
    );
  }
}








