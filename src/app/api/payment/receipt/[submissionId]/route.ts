import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";

export async function GET(req: NextRequest, { params }: { params: { submissionId: string } }) {
  try {
    await connectDB();
    const { submissionId } = params;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    if (submission.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Payment not complete." }, { status: 400 });
    }

    // Generate a simple HTML receipt for download (could easily convert to PDF later)
    const html = `
      <html><body style="font-family: Arial, sans-serif; padding: 32px; color: #3b3b3b;">
        <h2 style="color: #13627b;">Sterling Payment Receipt</h2>
        <p><b>Insured:</b> ${submission.clientContact.name}</p>
        <p><b>Email:</b> ${submission.clientContact.email}</p>
        <hr style="margin: 24px 0;">
        <p><b>Payment Date:</b> ${submission.paymentDate?.toLocaleString?.() || submission.paymentDate}</p>
        <p><b>Payment Amount:</b> <span style="color: #197650; font-size: 18px; font-weight: bold;">$${(submission.paymentAmount || 0).toFixed(2)}</span></p>
        <p><b>Payment Method:</b> ${submission.paymentMethod || "Card"}</p>
        <hr style="margin: 24px 0;">
        <p>Thank you for your payment.<br/>Sterling Wholesale Insurance</p>
      </body></html>
    `;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="Sterling-Receipt-${submissionId}.html"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Receipt download error" }, { status: 500 });
  }
}









