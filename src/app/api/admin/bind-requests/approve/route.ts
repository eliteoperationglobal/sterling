import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Quote from "@/models/Quote";
import Agency from "@/models/Agency";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";
import { getDisplayProgramName } from "@/utils/formatters";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APPLICATION_KEY || "",
  },
});

/**
 * POST /api/admin/bind-requests/approve
 * Approve a bind request (admin-only)
 * Body: FormData with submissionId, effectiveDate, expirationDate, policyNumber, binder?, policyDocs?
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

    const userRole = (session.user as any).role;
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const submissionId = formData.get("submissionId") as string;
    const policyType = formData.get("policyType") as string || "GENERAL_LIABILITY";
    const effectiveDate = formData.get("effectiveDate") as string;
    const expirationDate = formData.get("expirationDate") as string;
    const policyNumber = formData.get("policyNumber") as string;
    const binderFile = formData.get("binder") as File | null;
    const policyDocsFile = formData.get("policyDocs") as File | null;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Handle file uploads
    let binderUrl = null;
    let policyDocsUrl = null;

    if (binderFile) {
      const binderBuffer = Buffer.from(await binderFile.arrayBuffer());
      const binderKey = `submissions/${submissionId}/${policyType}-binder-${Date.now()}-${binderFile.name}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: binderKey,
          Body: binderBuffer,
          ContentType: binderFile.type,
        })
      );

      binderUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${binderKey}`;
    }

    if (policyDocsFile) {
      const policyDocsBuffer = Buffer.from(await policyDocsFile.arrayBuffer());
      const policyDocsKey = `submissions/${submissionId}/${policyType}-policy-docs-${Date.now()}-${policyDocsFile.name}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: policyDocsKey,
          Body: policyDocsBuffer,
          ContentType: policyDocsFile.type,
        })
      );

      policyDocsUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${policyDocsKey}`;
    }

    // Find and update the specific quote
    const quoteFilter: any = { submissionId: submission._id };
    if (policyType === 'GENERAL_LIABILITY') {
      quoteFilter.policyType = { $in: ['GENERAL_LIABILITY', null, undefined] };
    } else {
      quoteFilter.policyType = policyType;
    }

    // Prioritize quotes actively requesting a bind
    let quote = await Quote.findOne({ ...quoteFilter, status: "BIND_REQUESTED" });

    // Fallback to the most recent quote to handle edge cases
    if (!quote) {
      quote = await Quote.findOne(quoteFilter).sort({ createdAt: -1 });
    }
    if (!quote) {
      return NextResponse.json(
        { error: `Request for ${policyType.replace('_', ' ')} not found.` },
        { status: 404 }
      );
    }

    quote.status = "BOUND";
    quote.policyType = policyType as 'GENERAL_LIABILITY' | 'EXCESS_LIABILITY';
    if (effectiveDate) quote.effectiveDate = new Date(effectiveDate);
    if (expirationDate) quote.expirationDate = new Date(expirationDate);
    if (policyNumber) quote.policyNumber = policyNumber;
    if (binderUrl) quote.binderUrl = binderUrl;
    if (policyDocsUrl) quote.policyDocsUrl = policyDocsUrl;
    await quote.save();

    // Check if there are any other pending bind requests for this submission
    const pendingQuotes = await Quote.find({
      submissionId: submission._id,
      status: "BIND_REQUESTED"
    });

    const bindApprovedAt = new Date();

    if (pendingQuotes.length === 0) {
      // All quotes bound or none were requested
      (submission as any).bindApproved = true;
      (submission as any).bindApprovedAt = bindApprovedAt;
      (submission as any).bindStatus = "BOUND";
      submission.status = "BOUND";
    }

    // Save Legacy policy details to submission if it's GL
    if (policyType === 'GENERAL_LIABILITY') {
      if (policyNumber) (submission as any).policyNumber = policyNumber;
      if (effectiveDate) (submission as any).effectiveDate = new Date(effectiveDate);
      if (expirationDate) (submission as any).expirationDate = new Date(expirationDate);
      if (binderUrl) (submission as any).binderUrl = binderUrl;
      if (policyDocsUrl) (submission as any).policyDocsUrl = policyDocsUrl;
    }
    await submission.save();

    await logActivity(
      createActivityLogData(
        "POLICY_BOUND",
        `${policyType.replace('_', ' ')} Policy bound by admin`,
        {
          submissionId: submissionId,
          quoteId: quote._id.toString(),
          user: {
            id: (session.user as any).id,
            name: (session.user as any).name || (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "system_admin",
          },
          details: {
            clientName: (submission as any).clientContact?.name,
            bindApprovedAt: bindApprovedAt.toISOString(),
            policyType,
            policyNumber,
            effectiveDate,
            expirationDate,
            binderUrl,
            policyDocsUrl,
          },
        }
      )
    );

    // --- NEW SAFE EMAIL BLOCK START ---
    try {
      const agency = await Agency.findById(submission.agencyId);
      const agentName = submission.agentName || "";
      let resolvedBrokerEmail = agency?.email || (submission as any).clientContact?.email || "";

      const capcoAgentEmails: Record<string, string> = {
        "Eidan Gamaty": "Eidan@capcoinsurance.com",
        "Moshe Gamaty": "Moshe.g@capcoinsurance.com",
        "Michael Gamaty": "Michael@capcoinsurance.com",
        "Yoav Anatian": "Joe@capcoinsurance.com",
        "Jake Weiner": "Jake@capcoinsurance.com",
        "Benjamin Solender": "Ben@capcoinsurance.com",
        "Michal Kraut": "Michal@capcoinsurance.com",
        "Jonathan Akwa": "Jonathan@capcoinsurance.com",
      };

      if (agentName && capcoAgentEmails[agentName]) {
        resolvedBrokerEmail = capcoAgentEmails[agentName];
      }

      const { sendPolicyBoundEmailToBroker } = await import("@/lib/services/email/EmailService");
      await sendPolicyBoundEmailToBroker({
        brokerEmail: resolvedBrokerEmail,
        brokerName: agentName || agency?.name || "Agent",
        clientName: (submission as any).clientContact?.name || "Client",
        policyNumber: policyNumber || "Pending",
        effectiveDate: effectiveDate || "TBD",
        policyType: policyType,
        programName: getDisplayProgramName((submission as any).programName, (submission as any).payload?.industry) || "Insurance Program",
      });
      console.log("✅ Policy Bound email sent safely.");
    } catch (emailError) {
      console.error("❌ Policy Bound email failed to send, but binding succeeded:", emailError);
    }
    // --- NEW SAFE EMAIL BLOCK END ---

    return NextResponse.json({
      success: true,
      message: `${policyType.replace('_', ' ')} bound successfully.`,
    });
  } catch (error: any) {
    console.error("Admin bind-requests approve error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve bind request",
      },
      { status: 500 }
    );
  }
}

