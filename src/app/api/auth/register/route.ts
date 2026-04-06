import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Agency from "@/models/Agency";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

/**
 * POST /api/auth/register
 * Register a new agency and user (admin/seed only in production)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      agencyName,
      agencyEmail,
      agencyAddress,
      agencyPhone,
      userName,
      userEmail,
      password,
      role,
    } = body;

    // Validate required fields
    if (!agencyName || !agencyEmail || !userName || !userEmail || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if agency already exists
    let agency = await Agency.findOne({ email: agencyEmail });
    if (!agency) {
      // Create new agency
      agency = new Agency({
        name: agencyName,
        email: agencyEmail,
        address: agencyAddress || {
          street: "",
          city: "",
          state: "CA",
          zip: "",
        },
        phone: agencyPhone || "",
        allowedStates: ["CA"],
      });
      await agency.save();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      agencyId: agency._id,
      name: userName,
      email: userEmail,
      passwordHash,
      role: role || "agency_user",
    });
    await user.save();

    return NextResponse.json(
      {
        message: "Agency and user created successfully",
        agencyId: agency._id,
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}






