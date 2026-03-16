import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * GET /api/admin/quote-requests
 * Get all submissions with status "SUBMITTED" (waiting for admin quote)
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

    // Only system admin can access
    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure models are registered before populate
    await import("@/models/Agency");
    await import("@/models/FormTemplate");

    // Fetch submissions where status = "SUBMITTED"
    // These are applications that are waiting for an admin to enter a quote
    const submissions = await Submission.find({
      status: "SUBMITTED"
    })
      .populate("agencyId", "name")
      .populate("templateId", "industry subcategory title")
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error: any) {
    console.error("Admin quote requests error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch quote requests",
      },
      { status: 500 }
    );
  }
}
