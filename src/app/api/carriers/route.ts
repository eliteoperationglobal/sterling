import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Carrier from "@/models/Carrier";

/**
 * GET /api/carriers
 * Get all carriers (for agency to select when submitting)
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

    await connectDB();

    // Get query params for optional filtering
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state");
    const industry = searchParams.get("industry");

    let query: any = {};

    // Filter by state if provided
    if (state) {
      query.statesServed = state;
    }

    // Filter by industry if provided
    if (industry) {
      query.industries = industry;
    }

    const carriers = await Carrier.find(query)
      .select("name email statesServed industries wholesaleFeePercent")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      carriers: carriers.map((c: any) => ({
        _id: c._id.toString(),
        name: c.name,
        email: c.email,
        statesServed: c.statesServed,
        industries: c.industries,
        wholesaleFeePercent: c.wholesaleFeePercent,
      })),
      count: carriers.length,
    });
  } catch (error: any) {
    console.error("Carriers fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch carriers" },
      { status: 500 }
    );
  }
}



