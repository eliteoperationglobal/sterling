import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import AuditActivity from "@/models/AuditActivity";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const isAdmin = userRole === "system_admin";
    const userAgencyId = (session.user as any).agencyId ? String((session.user as any).agencyId) : null;

    if (!isAdmin && !userAgencyId) {
      return NextResponse.json({ error: "Forbidden: No associated agency found" }, { status: 403 });
    }

    await connectDB();
    const { id } = params;
    const body = await req.json();

    const audit = await Audit.findById(id).populate("submissionId");
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // 101% Multi-tenant security check:
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Agency users have read-only access and cannot modify audit financials" }, { status: 403 });
    }

    const { 
      auditedExposure, 
      estimatedExposure, 
      rate, 
      carrierFee, 
      sterlingFee, 
      surplusLinesTaxRate, 
      stampingFeeRate, 
      auditNotes, 
      status, 
      action,
      carrier,
      policyType,
      auditPeriodStart,
      auditPeriodEnd
    } = body;
    let activityLogDetails = "";
    let recalculateFinancials = false;

    // If updating audit period
    if (auditPeriodStart !== undefined && auditPeriodStart) {
      const parsedStart = new Date(auditPeriodStart);
      if (!isNaN(parsedStart.getTime())) {
        const oldStartStr = audit.auditPeriodStart ? new Date(audit.auditPeriodStart).toLocaleDateString("en-US") : "N/A";
        const newStartStr = parsedStart.toLocaleDateString("en-US");
        if (oldStartStr !== newStartStr) {
          activityLogDetails += `Audit period start changed from ${oldStartStr} to ${newStartStr}. `;
        }
        audit.auditPeriodStart = parsedStart;
        audit.auditEffectiveDate = parsedStart;
      }
    }

    if (auditPeriodEnd !== undefined && auditPeriodEnd) {
      const parsedEnd = new Date(auditPeriodEnd);
      if (!isNaN(parsedEnd.getTime())) {
        const oldEndStr = audit.auditPeriodEnd ? new Date(audit.auditPeriodEnd).toLocaleDateString("en-US") : "N/A";
        const newEndStr = parsedEnd.toLocaleDateString("en-US");
        if (oldEndStr !== newEndStr) {
          activityLogDetails += `Audit period end changed from ${oldEndStr} to ${newEndStr}. `;
        }
        audit.auditPeriodEnd = parsedEnd;
      }
    }

    // If updating estimated exposure
    if (estimatedExposure !== undefined) {
      const parsedEstExposure = parseFloat(estimatedExposure) || 0;
      if (audit.estimatedExposure !== parsedEstExposure) {
        activityLogDetails += `Updated original estimated exposure from $${audit.estimatedExposure} to $${parsedEstExposure}. `;
        audit.estimatedExposure = parsedEstExposure;
        recalculateFinancials = true;
      }
    }

    // If updating other fields

    if (auditedExposure !== undefined) {
      const parsedExposure = parseFloat(auditedExposure) || 0;
      if (audit.auditedExposure !== parsedExposure) {
        activityLogDetails += `Updated audited exposure to $${parsedExposure}. `;
        audit.auditedExposure = parsedExposure;
        recalculateFinancials = true;
      }
    }

    if (rate !== undefined) {
      const parsedRate = parseFloat(rate) || 0;
      if (audit.rate !== parsedRate) {
        activityLogDetails += `Updated rate to ${parsedRate}. `;
        audit.rate = parsedRate;
        recalculateFinancials = true;
      }
    }

    if (carrierFee !== undefined && audit.carrierFee !== carrierFee) {
      audit.carrierFee = parseFloat(carrierFee) || 0;
    }
    if (sterlingFee !== undefined && audit.sterlingFee !== sterlingFee) {
      audit.sterlingFee = parseFloat(sterlingFee) || 0;
    }
    if (surplusLinesTaxRate !== undefined && audit.surplusLinesTaxRate !== surplusLinesTaxRate) {
      audit.surplusLinesTaxRate = parseFloat(surplusLinesTaxRate) || 0;
      recalculateFinancials = true;
    }
    if (stampingFeeRate !== undefined && audit.stampingFeeRate !== stampingFeeRate) {
      audit.stampingFeeRate = parseFloat(stampingFeeRate) || 0;
      recalculateFinancials = true;
    }
    if (auditNotes !== undefined) {
      audit.auditNotes = auditNotes;
    }
    if (carrier !== undefined && typeof carrier === "string" && carrier.trim()) {
      const trimmedCarrier = carrier.trim();
      if (audit.carrier !== trimmedCarrier) {
        activityLogDetails += `Carrier changed from ${audit.carrier || "Unknown"} to ${trimmedCarrier}. `;
        audit.carrier = trimmedCarrier;
      }
    }
    if (policyType !== undefined && typeof policyType === "string" && policyType.trim()) {
      const trimmedPolicyType = policyType.trim();
      if (audit.policyType !== trimmedPolicyType) {
        activityLogDetails += `Policy Type changed from ${audit.policyType || "General Liability"} to ${trimmedPolicyType}. `;
        audit.policyType = trimmedPolicyType;
      }
    }

    if (recalculateFinancials || !audit.depositPremium) {
      // Backend Premium Calculation (Security: Do not trust frontend calculations)
      const basis = audit.rateBasis || 1000;
      const currentRate = audit.rate || 0;

      audit.depositPremium = ((audit.estimatedExposure || 0) / basis) * currentRate;
      audit.auditedPremium = ((audit.auditedExposure || 0) / basis) * currentRate;
      audit.netChange = audit.auditedPremium - audit.depositPremium;
      
      audit.surplusLinesTaxAmount = audit.netChange > 0 ? (audit.netChange * (audit.surplusLinesTaxRate || 0)) / 100 : 0;
      audit.stampingFeeAmount = audit.netChange > 0 ? (audit.netChange * (audit.stampingFeeRate || 0)) / 100 : 0;
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
        user: session.user.name || (isAdmin ? "Admin" : "Agency User"),
        role: isAdmin ? "System Admin" : "Agency",
        activity: action || (isAdmin ? "Audit Updated" : "Audit Updated by Agency"),
        details: activityLogDetails.trim()
      });
    }

    return NextResponse.json({ success: true, audit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required to delete audits" }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    const audit = await Audit.findById(id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // If it was attached to an old dummy manual submission, clean it up as well
    if (audit.submissionId) {
      const Submission = (await import("@/models/Submission")).default;
      const sub = await Submission.findById(audit.submissionId);
      if (sub && sub.payload?.source === "MANUAL_AUDIT") {
        await Submission.findByIdAndDelete(audit.submissionId);
      }
    }

    // Delete the audit and its activities
    await Promise.all([
      Audit.findByIdAndDelete(id),
      AuditActivity.deleteMany({ auditId: id })
    ]);

    return NextResponse.json({ success: true, message: "Audit deleted successfully" });
  } catch (err: any) {
    console.error("Delete Audit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
