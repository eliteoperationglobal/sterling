import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ToolRequest from "@/models/ToolRequest";

/**
 * GET /api/admin/tool-requests/[id]
 * Get a single tool request by ID
 */
export async function GET(
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

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const request = await ToolRequest.findById(params.id)
      .populate("agencyId", "name email")
      .populate("processedBy", "name email")
      .lean();

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error: any) {
    console.error("Fetch tool request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch request" },
      { status: 500 }
    );
  }
}

