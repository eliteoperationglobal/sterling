export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import GeneratedLink from "@/models/GeneratedLink";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) throw new Error("FATAL: JWT Secret is missing");

    let jtiToLookup: string;

    // A standard UUID is 36 characters long. If it's a UUID, it's a new-style link.
    // Otherwise, attempt to decode it as a legacy JWT.
    if (token.length === 36) {
      jtiToLookup = token;
    } else {
      try {
        const decoded: any = jwt.verify(token, jwtSecret);
        if (!decoded.jti) {
          return NextResponse.json({ valid: false, error: "Invalid token payload" }, { status: 401 });
        }
        jtiToLookup = decoded.jti;
      } catch (err: any) {
        return NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 401 });
      }
    }

    await connectDB();

    // Check DB for the link
    const link = await GeneratedLink.findOne({ jti: jtiToLookup });

    if (!link) {
      return NextResponse.json({ valid: false, error: "Link not found" }, { status: 404 });
    }

    if (link.used) {
      return NextResponse.json({ valid: false, error: "This link has already been used to submit an application" }, { status: 403 });
    }

    if (link.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "This link has expired" }, { status: 403 });
    }

    const expectedProgramId = searchParams.get("expectedProgramId");
    if (expectedProgramId && link.programId !== expectedProgramId) {
      return NextResponse.json({ valid: false, error: "This link is not valid for this program." }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      payload: {
        programId: link.programId,
        agentName: link.agentName,
        agencyName: link.agencyName,
        agencyId: link.agencyId.toString(),
      },
    });
  } catch (error: any) {
    console.error("Verify link error:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
