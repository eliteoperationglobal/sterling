import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

/**
 * GET /api/agency/applications
 * Get all applications for the agency
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    await connectDB();

    // Build query
    const query: any = { agencyId: user.agencyId };
    
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Get applications
    const applications = await Submission.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get counts by status
    const statusCounts = await Submission.aggregate([
      { $match: { agencyId: user.agencyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    statusCounts.forEach((item: any) => {
      counts[item._id] = item.count;
    });

    return NextResponse.json({
      applications: applications.map((app: any) => ({
        id: app._id.toString(),
        programId: app.programId,
        programName: app.programName,
        companyName: app.clientContact?.name || "Unknown",
        clientEmail: app.clientContact?.email || "",
        clientPhone: app.clientContact?.phone || "",
        status: app.status,
        submittedAt: app.createdAt,
        pdfUrl: app.applicationPdfUrl,
      })),
      counts,
    });
  } catch (error: any) {
    console.error("Applications fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}













