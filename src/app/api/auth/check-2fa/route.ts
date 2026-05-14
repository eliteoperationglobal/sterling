import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OTP from "@/models/OTP";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ required: false }, { status: 400 });
    }

    const is2FAEnabled = process.env.ENABLE_2FA === "true";
    if (!is2FAEnabled) {
      return NextResponse.json({ required: false });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ required: false });
    }

    // Check if there is an active (unexpired) OTP for this user
    const activeOtp = await OTP.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() }
    });

    return NextResponse.json({ required: !!activeOtp });
  } catch (error) {
    console.error("Check 2FA error:", error);
    return NextResponse.json({ required: false }, { status: 500 });
  }
}
