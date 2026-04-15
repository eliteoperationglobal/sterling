export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Submission from "@/models/Submission";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const agencyId = (session.user as any).agencyId;

        if (!agencyId) {
            return NextResponse.json({ error: "Agency ID not found in session" }, { status: 400 });
        }

        const [users, submissionAgentNames] = await Promise.all([
            User.find({ agencyId }).select("-passwordHash").lean(),
            Submission.find({ agencyId, agentName: { $exists: true, $ne: "" } }).distinct("agentName")
        ]);

        // Create a set of emails/names already in users to avoid duplicates
        const userNames = new Set(users.map(u => u.name.toLowerCase()));

        // Hardcoded agents from quote page
        const hardcodedAgentsMap: Record<string, string[]> = {
            "admin@agency1.com": ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"],
            "admin@blueangel.com": ["Max Mintz"],
            "admin@sjjinsurance.com": ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"]
        };

        const currentUserEmail = session.user?.email || "";
        const hardcodedNames = hardcodedAgentsMap[currentUserEmail] || [];

        // Convert hardcoded names to agent objects
        const hardcodedAgents = hardcodedNames
            .filter(name => !userNames.has(name.toLowerCase()))
            .map(name => ({
                _id: `hc_${name.replace(/\s+/g, "_")}`,
                name,
                email: "Hardcoded in System",
                role: "agency_user",
                isVirtual: true
            }));

        // Convert submission agent names to a similar format as users
        const submissionAgents = submissionAgentNames
            .filter(name => name && !userNames.has(name.toLowerCase()) && !hardcodedNames.includes(name))
            .map(name => ({
                _id: `sub_${name}`, // Virtual ID
                name,
                email: "From submission form",
                role: "agency_user",
                isVirtual: true
            }));

        const allAgents = [...users, ...hardcodedAgents, ...submissionAgents];

        return NextResponse.json({ agents: allAgents });
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch agents" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;

        if (user.role !== "agency_admin") {
            return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            agencyId: user.agencyId,
            name,
            email,
            passwordHash,
            role,
        });

        return NextResponse.json({
            message: "Agent created successfully",
            agent: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            }
        });

    } catch (error: any) {
        console.error("Error creating agent:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create agent" },
            { status: 500 }
        );
    }
}
