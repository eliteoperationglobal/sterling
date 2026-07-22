import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils/url";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import GeneratedLink from "@/models/GeneratedLink";
import Agency from "@/models/Agency";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { programId, agentName } = await req.json();

    if (!programId || !agentName) {
      return NextResponse.json({ error: "Missing required fields: programId and agentName" }, { status: 400 });
    }

    await connectDB();

    const agency = await Agency.findById(user.agencyId);
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const jti = uuidv4();
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const agencyName = agency.name || "Agency";

    // Store link in DB for single-use enforcement
    await GeneratedLink.create({
      jti,
      agencyId: agency._id,
      agentName,
      agencyName,
      programId,
      used: false,
      expiresAt,
    });

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback_secret";
    
    // Create JWT
    const token = jwt.sign(
      {
        jti,
        programId,
        agentName,
        agencyId: agency._id.toString(),
        agencyName,
      },
      jwtSecret,
      { expiresIn: `${expiresInDays}d` }
    );

    const appUrl = req.headers.get("origin") || getBaseUrl();
    const generatedUrl = `${appUrl}/agency/quote/${programId}?token=${token}`;

    return NextResponse.json({
      success: true,
      url: generatedUrl,
    });
  } catch (error: any) {
    console.error("Generate link error:", error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
