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
    if (!session || !session.user || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await import("@/models/Agency"); 
    
    const searchParams = req.nextUrl.searchParams;
    const submissionId = searchParams.get("submissionId");
    const auditId = searchParams.get("auditId");
    
    const query: any = {};
    if (submissionId) {
      query.submissionId = submissionId;
    }
    if (auditId) {
      query._id = auditId;
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
    if (!session || !session.user || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const body = await req.json();
    const { submissionIds } = body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "No submissions provided" }, { status: 400 });
    }
    
    const newAudits = [];
    const activities = [];
    
    for (const subId of submissionIds) {
      const submission: any = await Submission.findById(subId).populate("agencyId");
      if (!submission) continue;
      
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
        agencyId: submission.agencyId?._id,
        namedInsured: submission.payload?.companyName || submission.payload?.applicantName || submission.clientContact?.name || "Unknown Client",
        
        auditPeriodStart: submission.effectiveDate || new Date(),
        auditPeriodEnd: new Date(new Date(submission.effectiveDate || new Date()).setFullYear(new Date().getFullYear() + 1)),
        
        status: "REQUESTED",
        createdBy: session.user.name || "System Admin",
        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // Due in 14 days
        
        estimatedExposure: submission.payload?.estimatedGrossSales || 100000,
        rate: 12.50, // Example default
        depositPremium: submission.payload?.totalPremium || 0,
        
        documents: [
          {
            documentId: "DOC-" + Math.floor(1000 + Math.random() * 9000),
            name: "Tax Return",
            status: "REQUESTED"
          },
          {
            documentId: "DOC-" + Math.floor(1000 + Math.random() * 9000),
            name: "Year-End P&L",
            status: "REQUESTED"
          }
        ]
      });
      
      await audit.save();
      newAudits.push(audit);
      
      // Log activity
      activities.push({
        auditId: audit._id,
        user: session.user.name || "Admin",
        role: "System Admin",
        activity: "Audit requested manually",
        details: "Audit manually requested from queue"
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
