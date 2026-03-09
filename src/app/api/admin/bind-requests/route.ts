import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * GET /api/admin/bind-requests
 * Get all submissions with bindRequested = true && bindApproved = false
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

    // Ensure models are registered before populate (important on serverless/cold starts)
    await import("@/models/Agency");
    await import("@/models/FormTemplate");

    // Fetch submissions where bindRequested = true && bindApproved = false
    const submissions = await Submission.find({
      bindRequested: true,
      bindApproved: { $ne: true }, // Not approved yet
    })
      .populate("agencyId", "name")
      .populate("templateId", "industry subcategory")
      .sort({ bindRequestedAt: -1 }) // Most recent first
      .lean();

    return NextResponse.json({
      success: true,
      submissions,
      // Alias for legacy consumers (admin dashboard expects `requests`)
      requests: submissions,
      count: submissions.length,
    });
  } catch (error: any) {
    console.error("Admin bind requests error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bind requests",
      },
      { status: 500 }
    );
  }
}



