import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CancelRequest from "@/models/CancelRequest";
import Submission from "@/models/Submission";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || !session.user || (userRole !== "agency_admin" && userRole !== "agency_user")) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();
        const { submissionId } = body;

        if (!submissionId) {
            return NextResponse.json({ success: false, message: "No submissionId" });
        }

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return NextResponse.json({ success: false, message: "Submission not found" }, { status: 404 });
        }

        if (submission.agencyId?.toString() !== (session.user as any).agencyId) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
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