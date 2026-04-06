import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/agency/agents
 * Returns all users (agents) belonging to the same agency as the logged-in user.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        if (!user.agencyId) {
            return NextResponse.json({ error: "No agency found for user" }, { status: 400 });
        }

        await connectDB();

        const agents = await User.find({ agencyId: user.agencyId })
            .select("_id name email role")
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            agents: agents.map((a: any) => ({
                id: a._id.toString(),
                name: a.name,
                email: a.email,
                role: a.role,
            })),
        });
    } catch (error: any) {
        console.error("Agents API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch agents" },
            { status: 500 }
        );
    }
}
