import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import AuditActivity from "@/models/AuditActivity";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const body = await req.json();

    const audit = await Audit.findById(id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const { auditedExposure, estimatedExposure, rate, status, action } = body;
    let activityLogDetails = "";

    // If updating estimated exposure
    if (estimatedExposure !== undefined) {
      const parsedEstExposure = parseFloat(estimatedExposure);
      if (audit.estimatedExposure !== parsedEstExposure) {
        activityLogDetails += `Updated original estimated exposure from $${audit.estimatedExposure} to $${parsedEstExposure}. `;
        audit.estimatedExposure = parsedEstExposure;
        
        // Recalculate original deposit premium based on the new estimate
        if (audit.rateBasis && audit.rate) {
          audit.depositPremium = (parsedEstExposure / audit.rateBasis) * audit.rate;
        }
      }
    }

    // If updating exposure and rate
    if (auditedExposure !== undefined && rate !== undefined) {
      const parsedExposure = parseFloat(auditedExposure);
      const parsedRate = parseFloat(rate);

      if (audit.auditedExposure !== parsedExposure || audit.rate !== parsedRate) {
        activityLogDetails += `Updated exposure from $${audit.auditedExposure} to $${parsedExposure}. Updated rate from ${audit.rate} to ${parsedRate}. `;
        
        audit.auditedExposure = parsedExposure;
        audit.rate = parsedRate;
        
        // Backend Premium Calculation (Security: Do not trust frontend calculations)
        audit.auditedPremium = (parsedExposure / audit.rateBasis) * parsedRate;
        audit.netChange = audit.auditedPremium - audit.depositPremium;
        
        audit.surplusLinesTaxAmount = (audit.netChange * audit.surplusLinesTaxRate) / 100;
        audit.stampingFeeAmount = (audit.netChange * audit.stampingFeeRate) / 100;
      }
    }

    // If updating status (e.g., Submit for Review)
    if (status && status !== audit.status) {
      activityLogDetails += `Status changed from ${audit.status} to ${status}. `;
      audit.status = status;
    }

    await audit.save();

    // Log the activity
    if (activityLogDetails) {
      await AuditActivity.create({
        auditId: audit._id,
        user: session.user.name || "Admin",
        role: "System Admin",
        activity: action || "Audit Updated",
        details: activityLogDetails.trim()
      });
    }

    return NextResponse.json({ success: true, audit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
