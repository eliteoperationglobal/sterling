import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Audit from "@/models/Audit";
import Agency from "@/models/Agency";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "system_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { clientName, email, phone, agencyName, industry } = body;

    if (!clientName || !email || !phone) {
      return NextResponse.json({ error: "Client Name, Email, and Phone are required" }, { status: 400 });
    }

    // 1. Try to find the associated agency if provided
    let agencyId = null;
    if (agencyName) {
      const agency = await Agency.findOne({ name: agencyName });
      if (agency) {
        agencyId = agency._id;
      }
    }

    // Generate a random submission number for the manual audit
    const submissionNumber = Math.floor(100000 + Math.random() * 900000);

    // 2. Create the skeleton submission (BOUND)
    const newSubmission = new Submission({
      agencyId: agencyId || new mongoose.Types.ObjectId(), // fallback to dummy ID if none
      agentName: "Manual Audit Creator", // Generic agent name
      templateId: new mongoose.Types.ObjectId(), // Dummy template
      status: "BOUND",
      submissionNumber,
      programName: industry || "General Liability",
      clientContact: {
        name: clientName,
        email: email,
        phone: phone,
        businessAddress: { street: "N/A", city: "N/A", state: "CA", zip: "00000" }
      },
      ccpaConsent: true,
      state: "CA",
      payload: {
        source: "MANUAL_AUDIT",
        notes: "Automatically generated skeleton submission for manual audit."
      },
      files: [],
      signedDocuments: [],
      paymentStatus: "PENDING",
      esignCompleted: false
    });

    await newSubmission.save();

    // 3. Create the Audit record tied to this submission
    // Generate unique audit ID
    const year = new Date().getFullYear();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const auditId = `AUD-${year}-${uniqueSuffix}`;

    const auditStart = new Date();
    auditStart.setFullYear(auditStart.getFullYear() - 1); // Audit is usually for previous year
    const auditEnd = new Date();

    const newAudit = new Audit({
      auditId,
      submissionId: newSubmission._id,
      policyNumber: `POL-${submissionNumber}`,
      carrier: "Unknown Carrier", // To be filled by admin later
      program: newSubmission.programName,
      agencyId: agencyId,
      namedInsured: clientName,
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
      auditEffectiveDate: new Date(),
      
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

    return NextResponse.json({ 
      success: true, 
      submissionId: newSubmission._id,
      auditId: newAudit._id
    });

  } catch (error: any) {
    console.error("Error creating manual audit:", error);
    return NextResponse.json(
      { error: "Failed to create manual audit profile" },
      { status: 500 }
    );
  }
}
