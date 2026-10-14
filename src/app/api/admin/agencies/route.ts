export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Agency from "@/models/Agency";
import User from "@/models/User";

/**
 * GET /api/admin/agencies
 * Returns all registered retail agencies for admin selection/impersonation.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await connectDB();

    // Fetch all agencies except internal system admin agency
    const agencies = await Agency.find({
      name: { $ne: "Sterling Wholesale Insurance" },
      email: { $ne: "system@sterling.com" }
    })
      .select("_id name email phone address allowedStates createdAt")
      .sort({ name: 1 })
      .lean();

    // Fetch users for these agencies to populate agent lists
    const users = await User.find({
      role: { $in: ["agency_admin", "agency_user"] }
    })
      .select("_id name email agencyId role")
      .sort({ name: 1 })
      .lean();

    // Group agents by agencyId
    const agenciesWithAgents = agencies.map((agency: any) => {
      const agencyIdStr = agency._id.toString();
      const agencyUsers = users.filter((u: any) => u.agencyId?.toString() === agencyIdStr);
      return {
        _id: agencyIdStr,
        name: agency.name,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        allowedStates: agency.allowedStates,
        agents: agencyUsers.map((u: any) => ({
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
        })),
      };
    });

    // Deduplicate agencies by normalized name (each agency name shown only once)
    // Prioritize the agency that has active agents / users
    const nameMap = new Map<string, any>();
    for (const agency of agenciesWithAgents) {
      const cleanName = agency.name?.trim();
      if (!cleanName) continue;
      const key = cleanName.toLowerCase();
      if (!nameMap.has(key)) {
        nameMap.set(key, agency);
      } else {
        const existing = nameMap.get(key);
        const existingCount = existing.agents?.length || 0;
        const currentCount = agency.agents?.length || 0;
        if (currentCount > existingCount) {
          nameMap.set(key, agency);
        }
      }
    }

    const uniqueAgencies = Array.from(nameMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({
      success: true,
      agencies: uniqueAgencies,
    });
  } catch (error: any) {
    console.error("Error fetching admin agencies:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}
