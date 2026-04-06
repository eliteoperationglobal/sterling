import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agency from "@/models/Agency";

/**
 * GET /api/me
 * Get current user and agency information (protected)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById((session.user as any).id).populate("agencyId");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const agency = await Agency.findById(user.agencyId);

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      agency: agency
        ? {
            id: agency._id,
            name: agency.name,
            email: agency.email,
            address: agency.address,
            phone: agency.phone,
            allowedStates: agency.allowedStates,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Me API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user data" },
      { status: 500 }
    );
  }
}






