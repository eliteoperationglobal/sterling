import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ToolRequest from "@/models/ToolRequest";
import { sendEmail } from "@/lib/services/email/EmailService";

/**
 * POST /api/agency/tools/request
 * Submit a new tool request (Loss Runs, BOR, Reports, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only agency users can submit requests
    const userRole = (session.user as any).role;
    if (userRole !== "agency_admin" && userRole !== "agency_user") {
      return NextResponse.json(
        { error: "Forbidden - Agency access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const agencyId = (session.user as any).agencyId;
    const body = await req.json();

    const {
      requestType,
      clientName,
      clientEmail,
      clientPhone,
      submissionId,
      requestData,
    } = body;

    // Validation
    if (!requestType || !clientName || !requestData) {
      return NextResponse.json(
        { error: "requestType, clientName, and requestData are required" },
        { status: 400 }
      );
    }

    // Create tool request
    const toolRequest = await ToolRequest.create({
      agencyId,
      requestType,
      status: "PENDING",
      clientName,
      clientEmail,
      clientPhone,
      submissionId,
      requestData,
    });

    console.log("✅ Tool request created successfully");
    console.log(`   Request ID: ${toolRequest._id}`);
    console.log(`   Type: ${requestType}`);
    console.log(`   Client: ${clientName}`);

    // Send email notification to admin (mock mode)
    try {
      const requestTypeLabels: Record<string, string> = {
        LOSS_RUNS: "Loss Runs",
        BOR: "Broker of Record",
        MVR: "MVR Report",
        CREDIT_REPORT: "Credit Report",
        OTHER_REPORT: "Other Report",
      };

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@sterlingwholesale.com",
        subject: `New ${requestTypeLabels[requestType] || "Tool"} Request`,
        html: `
          <h2>New Tool Request Received</h2>
          <p><strong>Request Type:</strong> ${requestTypeLabels[requestType] || requestType}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          ${clientEmail ? `<p><strong>Email:</strong> ${clientEmail}</p>` : ""}
          ${clientPhone ? `<p><strong>Phone:</strong> ${clientPhone}</p>` : ""}
          <p><strong>Request ID:</strong> ${toolRequest._id}</p>
          <p>Please log in to the admin portal to process this request.</p>
        `,
        text: `New ${requestTypeLabels[requestType] || "Tool"} Request from ${clientName}`,
      });
      console.log("📧 Email notification sent to admin");
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId: toolRequest._id.toString(),
      message: "Request submitted successfully",
    });
  } catch (error: any) {
    console.error("Tool request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}









