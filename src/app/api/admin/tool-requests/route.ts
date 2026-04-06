import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ToolRequest from "@/models/ToolRequest";

/**
 * GET /api/admin/tool-requests
 * Get all tool requests (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only system_admin can access
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Fetch all tool requests with agency information
    const requests = await ToolRequest.find()
      .populate("agencyId", "name email")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = requests.filter((r: any) => r.status === "PENDING").length;

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
      pendingCount,
    });
  } catch (error: any) {
    console.error("Fetch tool requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

