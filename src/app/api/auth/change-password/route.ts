import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById((session.user as any).id);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = newPasswordHash;
        await user.save();

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error: any) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: error.message || "Failed to change password" },
            { status: 500 }
        );
    }
}
