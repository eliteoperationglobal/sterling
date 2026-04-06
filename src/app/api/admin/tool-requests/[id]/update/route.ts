import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import ToolRequest from "@/models/ToolRequest";
import { sendEmail } from "@/lib/services/email/EmailService";

/**
 * PATCH /api/admin/tool-requests/[id]/update
 * Update tool request status and notes
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { status, adminNotes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    const updateData: any = {
      status,
      processedBy: userId,
      processedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const request = await ToolRequest.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate("agencyId", "name email");

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Tool request ${params.id} updated to status: ${status}`);

    // Send email notification to agency
    try {
      const requestTypeLabels: Record<string, string> = {
        LOSS_RUNS: "Loss Runs",
        BOR: "Broker of Record",
        MVR: "MVR Report",
        CREDIT_REPORT: "Credit Report",
        OTHER_REPORT: "Other Report",
      };

      await sendEmail({
        to: (request.agencyId as any).email,
        subject: `Tool Request Update: ${requestTypeLabels[request.requestType] || "Tool Request"}`,
        html: `
          <h2>Your Tool Request Has Been Updated</h2>
          <p><strong>Request Type:</strong> ${requestTypeLabels[request.requestType] || request.requestType}</p>
          <p><strong>Client:</strong> ${request.clientName}</p>
          <p><strong>New Status:</strong> ${status}</p>
          ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ""}
          <p>Please log in to your agency portal to view the full details.</p>
        `,
        text: `Your tool request for ${request.clientName} has been updated to: ${status}`,
      });
      console.log("📧 Email notification sent to agency");
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      request,
      message: "Request updated successfully",
    });
  } catch (error: any) {
    console.error("Update tool request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update request" },
      { status: 500 }
    );
  }
}

