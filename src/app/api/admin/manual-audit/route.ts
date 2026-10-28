import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import Agency from "@/models/Agency";
import AuditActivity from "@/models/AuditActivity";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { clientName, email, phone, agencyName, industry, policyNumber, date, carrier, policyType } = body;

    if (!clientName || !email || !phone) {
      return NextResponse.json({ error: "Client Name, Email, and Phone are required" }, { status: 400 });
    }

    // 1. Try to find the associated agency if provided
    let agencyId = null;
    if (agencyName && typeof agencyName === "string" && agencyName.trim()) {
      const trimmedAgency = agencyName.trim();
      const escaped = trimmedAgency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingAgencies = await Agency.find({ 
        name: { $regex: new RegExp("^" + escaped + "$", "i") } 
      }).lean();

      if (matchingAgencies.length === 1) {
        agencyId = matchingAgencies[0]._id;
      } else if (matchingAgencies.length > 1) {
        // Pick the active agency that has registered users or submissions
        const User = (await import("@/models/User")).default;
        const Submission = (await import("@/models/Submission")).default;
        let bestAgency = matchingAgencies[0];
        let maxScore = -1;
        for (const ag of matchingAgencies) {
          const userCount = await User.countDocuments({ agencyId: ag._id });
          const subCount = await Submission.countDocuments({ agencyId: ag._id });
          const score = userCount * 10 + subCount;
          if (score > maxScore) {
            maxScore = score;
            bestAgency = ag;
          }
        }
        agencyId = bestAgency._id;
      }
    }

    // Handle carrier
    const finalCarrier = (carrier && typeof carrier === "string" && carrier.trim())
      ? carrier.trim()
      : "Richmond National Insurance";

    // Handle policy number
    const submissionNumber = Math.floor(100000 + Math.random() * 900000);
    const finalPolicyNumber = (policyNumber && typeof policyNumber === "string" && policyNumber.trim())
      ? policyNumber.trim()
      : `POL-${submissionNumber}`;

    // Handle date (US format MM/DD/YYYY or standard Date string)
    let effectiveDate = new Date();
    let hasCustomDate = false;

    if (date && typeof date === "string" && date.trim()) {
      const trimmedDate = date.trim();
      if (trimmedDate.includes("/")) {
        const parts = trimmedDate.split("/").map(p => parseInt(p, 10));
        // US format: MM/DD/YYYY
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          const parsed = new Date(parts[2], parts[0] - 1, parts[1]);
          if (!isNaN(parsed.getTime())) {
            effectiveDate = parsed;
            hasCustomDate = true;
          }
        }
      } else if (!isNaN(Date.parse(trimmedDate))) {
        effectiveDate = new Date(trimmedDate);
        hasCustomDate = true;
      }
    }

    // Generate unique audit ID
    const year = effectiveDate.getFullYear() || new Date().getFullYear();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const auditId = `AUD-${year}-${uniqueSuffix}`;

    let auditStart: Date;
    let auditEnd: Date;

    if (hasCustomDate) {
      auditStart = new Date(effectiveDate);
      auditEnd = new Date(effectiveDate);
      auditEnd.setFullYear(auditEnd.getFullYear() + 1);
    } else {
      auditStart = new Date();
      auditStart.setFullYear(auditStart.getFullYear() - 1);
      auditEnd = new Date();
    }

    const isConstruction = (industry || "").trim().toLowerCase() === "construction";
    const finalPolicyType = isConstruction
      ? (policyType && typeof policyType === "string" && policyType.trim() ? policyType.trim() : "General Liability")
      : "General Liability";

    const newAudit = new Audit({
      auditId,
      source: "MANUAL_AUDIT",
      policyNumber: finalPolicyNumber,
      carrier: finalCarrier,
      program: industry || "General Liability",
      policyType: finalPolicyType,
      agencyId: agencyId,
      namedInsured: clientName,
      clientEmail: email,
      clientPhone: phone,
      auditPeriodStart: auditStart,
      auditPeriodEnd: auditEnd,
      status: "REQUESTED",
      createdBy: (session.user as any).name || "System Admin",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      
      exposureBasis: "Gross Sales",
      estimatedExposure: 0,
      auditedExposure: 0,
      rate: 0,
      rateBasis: 1000,
      auditEffectiveDate: effectiveDate,
      
      depositPremium: 0,
      auditedPremium: 0,
      surplusLinesTaxRate: 4.85,
      stampingFeeRate: 0.04,
      carrierFee: 0,
      sterlingFee: 0,
      
      surplusLinesTaxAmount: 0,
      stampingFeeAmount: 0,
      netChange: 0,
      
      documents: []
    });

    await newAudit.save();

    // Log the creation
    await AuditActivity.create({
      auditId: newAudit._id,
      user: (session.user as any).name || "Admin",
      role: "System Admin",
      activity: "Manual audit profile created",
      timestamp: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      auditId: newAudit._id
    });

  } catch (error: any) {
    console.error("Error creating manual audit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create manual audit profile" },
      { status: 500 }
    );
  }
}
