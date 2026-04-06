import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();
        const { submissionId } = body;

        if (!submissionId) {
            return NextResponse.json({ success: false, message: "No submissionId" });
        }

        // ⭐ already request check
        const existing = await CancelRequest.findOne({
            submissionId,
            status: "PENDING",
        });

        if (existing) {
            return NextResponse.json({
                success: false,
                message: "Already requested",
            });
        }

        // ⭐ create request
        await CancelRequest.create({
            submissionId,
            status: "PENDING",
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.log(err);
        return NextResponse.json({ success: false });
    }
}