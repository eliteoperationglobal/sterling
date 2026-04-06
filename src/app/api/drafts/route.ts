import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Draft from "@/models/Draft";

/**
 * Draft API - Save Draft
 * POST /api/drafts
 * 
 * Saves or updates a form draft
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { formType, formId, data } = body;

    if (!formType || !formId || !data) {
      return NextResponse.json(
        { error: "formType, formId, and data are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role || "agency";

    // Upsert draft (create or update)
    const draft = await Draft.findOneAndUpdate(
      {
        formType,
        formId,
        userId,
      },
      {
        formType,
        formId,
        userId,
        userRole,
        data,
        lastSaved: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      draft: {
        _id: draft._id,
        formType: draft.formType,
        formId: draft.formId,
        data: draft.data,
        lastSaved: draft.lastSaved,
      },
    });
  } catch (error: any) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Draft API - Get Draft
 * GET /api/drafts?formType=admin_quote&formId=123
 * 
 * Retrieves a form draft
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formType = searchParams.get("formType");
    const formId = searchParams.get("formId");

    if (!formType || !formId) {
      return NextResponse.json(
        { error: "formType and formId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    const draft = await Draft.findOne({
      formType,
      formId,
      userId,
    });

    if (!draft) {
      return NextResponse.json({
        success: true,
        draft: null,
      });
    }

    return NextResponse.json({
      success: true,
      draft: {
        _id: draft._id,
        formType: draft.formType,
        formId: draft.formId,
        data: draft.data,
        lastSaved: draft.lastSaved,
      },
    });
  } catch (error: any) {
    console.error("Error loading draft:", error);
    return NextResponse.json(
      { error: "Failed to load draft", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Draft API - Delete Draft
 * DELETE /api/drafts?formType=admin_quote&formId=123
 * 
 * Deletes a form draft (called after form is submitted)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formType = searchParams.get("formType");
    const formId = searchParams.get("formId");

    if (!formType || !formId) {
      return NextResponse.json(
        { error: "formType and formId are required as query parameters" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Delete draft by formType, formId, and userId (for security)
    const result = await Draft.deleteOne({
      formType,
      formId,
      userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "Draft not found or already deleted",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft", details: error.message },
      { status: 500 }
    );
  }
}

