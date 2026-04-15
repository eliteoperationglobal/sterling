export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Agency from "@/models/Agency";

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

        const agency = await Agency.findById(agencyId).lean();

        if (!agency) {
            return NextResponse.json({ error: "Agency not found" }, { status: 404 });
        }

        return NextResponse.json({ agency });
    } catch (error: any) {
        console.error("Error fetching agency details:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch agency details" },
            { status: 500 }
        );
    }
}
