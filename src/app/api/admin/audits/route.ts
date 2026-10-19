export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Audit from "@/models/Audit";
import Submission from "@/models/Submission";
import AuditActivity from "@/models/AuditActivity";

export async function GET(req: NextRequest) {
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
    const Agency = (await import("@/models/Agency")).default;
    
    // Resolve all matching agency IDs for this user (handles sibling/duplicate agency docs by name)
    let allUserAgencyIds: string[] = userAgencyId ? [userAgencyId] : [];
    if (!isAdmin && userAgencyId) {
      const userAgency = await Agency.findById(userAgencyId).lean();
      const agencyName = (userAgency as any)?.name || (session.user as any)?.agencyName;
      if (agencyName && typeof agencyName === "string" && agencyName.trim()) {
        const escaped = agencyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const siblingAgencies = await Agency.find({
          name: { $regex: new RegExp("^" + escaped + "$", "i") }
        }).distinct("_id");
        allUserAgencyIds = Array.from(new Set([...allUserAgencyIds, ...siblingAgencies.map((id: any) => String(id))]));
      }
    }
    
    const searchParams = req.nextUrl.searchParams;
    const submissionId = searchParams.get("submissionId");
    const auditId = searchParams.get("auditId");
    
    const query: any = {};
    if (submissionId) {
      // 101% Multi-tenant check: if agency user, verify submission belongs to their agency
      if (!isAdmin) {
        const submission = await Submission.findOne({ _id: submissionId, agencyId: { $in: allUserAgencyIds } }).lean();
        if (!submission) {
          return NextResponse.json({ error: "Forbidden: Submission not found or does not belong to your agency" }, { status: 403 });
        }
      }
      query.submissionId = submissionId;
    }
    if (auditId) {
      query._id = auditId;
    }

    const source = searchParams.get("source");
    if (source) {
      query.source = source;
    }

    // If agency user and no specific submissionId/auditId requested, scope strictly to their agencyId
    if (!isAdmin && !submissionId && !auditId) {
      const agencySubIds = await Submission.find({ agencyId: { $in: allUserAgencyIds } }).distinct("_id");
      const { default: mongoose } = await import("mongoose");
      const agencyObjectIds = allUserAgencyIds.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch {
          return id;
        }
      });
      query.$or = [
        { agencyId: { $in: allUserAgencyIds } },
        { agencyId: { $in: agencyObjectIds } },
        { submissionId: { $in: agencySubIds } }
      ];
    }
    
    // Fetch audits, sort by dueDate ascending
    const audits = await Audit.find(query)
      .sort({ dueDate: 1 })
      .populate("agencyId")
      .populate({
        path: "submissionId",
        populate: { path: "agencyId" }
      })
      .lean();

    // 101% Multi-tenant check for single auditId query:
    if (!isAdmin && auditId && audits.length > 0) {
      const foundAudit = audits[0] as any;
      const auditAgencyId = foundAudit.agencyId?._id ? String(foundAudit.agencyId._id) : (foundAudit.agencyId ? String(foundAudit.agencyId) : null);
      const subAgencyId = foundAudit.submissionId?.agencyId?._id ? String(foundAudit.submissionId.agencyId._id) : (foundAudit.submissionId?.agencyId ? String(foundAudit.submissionId.agencyId) : null);

      if (!allUserAgencyIds.includes(auditAgencyId || "") && !allUserAgencyIds.includes(subAgencyId || "")) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this audit" }, { status: 403 });
      }
    }
    
    if ((submissionId || auditId) && audits.length > 0) {
      const activities = await AuditActivity.find({ auditId: audits[0]._id }).sort({ timestamp: -1 }).lean();
      (audits[0] as any).activities = activities;
    }
    
    return NextResponse.json({ success: true, audits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    
    const body = await req.json();
    const { submissionIds } = body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "No submissions provided" }, { status: 400 });
    }
    
    // Resolve all matching agency IDs for this user
    let allUserAgencyIds: string[] = userAgencyId ? [userAgencyId] : [];
    if (!isAdmin && userAgencyId) {
      const Agency = (await import("@/models/Agency")).default;
      const userAgency = await Agency.findById(userAgencyId).lean();
      const agencyName = (userAgency as any)?.name || (session.user as any)?.agencyName;
      if (agencyName && typeof agencyName === "string" && agencyName.trim()) {
        const escaped = agencyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const siblingAgencies = await Agency.find({
          name: { $regex: new RegExp("^" + escaped + "$", "i") }
        }).distinct("_id");
        allUserAgencyIds = Array.from(new Set([...allUserAgencyIds, ...siblingAgencies.map((id: any) => String(id))]));
      }
    }

    const newAudits = [];
    const activities = [];
    
    for (const subId of submissionIds) {
      const submission: any = await Submission.findById(subId).populate("agencyId");
      if (!submission) continue;

      // 101% Multi-tenant check: agency user can only start audit for their own submission
      if (!isAdmin) {
        const subAgencyId = submission.agencyId?._id ? String(submission.agencyId._id) : (submission.agencyId ? String(submission.agencyId) : null);
        if (!allUserAgencyIds.includes(subAgencyId || "")) {
          continue; // skip unauthorized submissions
        }
      }
      
      // Check if audit already exists for this submission to avoid duplicates
      const existingAudit = await Audit.findOne({ submissionId: subId });
      if (existingAudit) continue;
      
      const auditId = "AUD-" + Math.floor(10000 + Math.random() * 90000);
      
      const audit = new Audit({
        auditId,
        submissionId: subId,
        policyNumber: submission.policyNumber || "PENDING",
        carrier: submission.payload?.carrier || "Kinsale Insurance Company",
        program: submission.programName || submission.industry || "Construction",
        agencyId: submission.agencyId?._id || submission.agencyId,
        namedInsured: submission.payload?.companyName || submission.payload?.applicantName || submission.clientContact?.name || "Unknown Client",
        
        auditPeriodStart: submission.effectiveDate || new Date(),
        auditPeriodEnd: new Date(new Date(submission.effectiveDate || new Date()).setFullYear(new Date().getFullYear() + 1)),
        
        status: "REQUESTED",
        createdBy: session.user.name || (isAdmin ? "System Admin" : "Agency User"),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // Due in 14 days
        
        estimatedExposure: submission.payload?.estimatedGrossSales || 100000,
        rate: 12.50, // Example default
        depositPremium: submission.payload?.totalPremium || 0,
        
        documents: []
      });
      
      await audit.save();
      newAudits.push(audit);
      
      // Log activity
      activities.push({
        auditId: audit._id,
        user: session.user.name || (isAdmin ? "Admin" : "Agency User"),
        role: isAdmin ? "System Admin" : "Agency",
        activity: "Audit requested manually",
        details: isAdmin ? "Audit manually requested from queue" : "Audit manually requested by agency"
      });
    }
    
    if (activities.length > 0) {
      await AuditActivity.insertMany(activities);
    }
    
    return NextResponse.json({ success: true, count: newAudits.length, audits: newAudits });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
