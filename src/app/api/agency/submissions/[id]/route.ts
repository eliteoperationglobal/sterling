import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import FormTemplate from "@/models/FormTemplate";
import ActivityLog from "@/models/ActivityLog";
import RoutingLog from "@/models/RoutingLog";
import Quote from "@/models/Quote";
import { logActivity, createActivityLogData } from "@/utils/activityLogger";


/**
 * GET /api/agency/submissions/[id]
 * Get a single submission with full details (routing logs, quotes, timeline)
 */
export async function GET(
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

    await connectDB();

    // Ensure models are registered before populate
    await import("@/models/FormTemplate");
    await import("@/models/Carrier");
    const { default: BoundPolicy } = await import("@/models/BoundPolicy");
    const { default: CancelRequest } = await import("@/models/CancelRequest");

    // Find submission — admin can view any submission, agency users only their own
    const userRole = (session.user as any).role;
    const isAdmin = userRole === "system_admin";

    const submission = await Submission.findOne(
      isAdmin
        ? { _id: params.id }                                             // admin: no agency filter
        : { _id: params.id, agencyId: (session.user as any).agencyId }  // agency: scoped to their own
    )
      .populate("templateId")
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Fetch related records concurrently to improve load times
    const [routingLogs, quotes, boundPolicy, activityLogs, pendingCancelRequest] = await Promise.all([
      RoutingLog.find({ submissionId: params.id })
        .populate("carrierId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Quote.find({ submissionId: params.id })
        .populate("carrierId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      (BoundPolicy as any).findOne({ submissionId: params.id }).lean(),
      ActivityLog.find({ submissionId: params.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      (CancelRequest as any).findOne({ submissionId: params.id, status: "PENDING" }).lean(),
    ]);

    const isScheduledCancel = (submission as any).effectiveCancellationDate && submission.status !== "CANCELLED";
    const isPolicyScheduledCancel = boundPolicy && (boundPolicy as any).effectiveCancellationDate && boundPolicy.status !== "CANCELLED";

    return NextResponse.json({
      cancelRequested: !!pendingCancelRequest || isScheduledCancel || isPolicyScheduledCancel,
      submission: {
        ...submission,
        _id: submission._id.toString(),
        agencyId: submission.agencyId.toString(),
        templateId: submission.templateId
          ? {
            ...submission.templateId,
            _id: (submission.templateId as any)._id.toString(),
          }
          : null,
        programId: (submission as any).programId || null,
        programName: (submission as any).programName || null,
        adminNotes: (submission as any).adminNotes || null,
        effectiveCancellationDate: boundPolicy && (boundPolicy as any).effectiveCancellationDate ? (boundPolicy as any).effectiveCancellationDate : (submission as any).effectiveCancellationDate || null,
      },
      routingLogs: routingLogs.map((log: any) => ({
        ...log,
        _id: log._id.toString(),
        submissionId: log.submissionId.toString(),
        carrierId: log.carrierId
          ? {
            _id: (log.carrierId as any)._id.toString(),
            name: (log.carrierId as any).name,
            email: (log.carrierId as any).email,
          }
          : null,
      })),
      quotes: quotes.map((quote: any) => {
        // 🔥 FIX: convert Map → Object
        const checkedDocs =
          quote.checkedDocuments instanceof Map
            ? Object.fromEntries(quote.checkedDocuments)
            : quote.checkedDocuments || {};

        return {
          ...quote,
          _id: quote._id.toString(),
          submissionId: quote.submissionId.toString(),
          policyType: quote.policyType,

          carrierId: quote.carrierId
            ? {
              _id: (quote.carrierId as any)._id.toString(),
              name: (quote.carrierId as any).name,
              email: (quote.carrierId as any).email,
            }
            : null,

          carrierFeesUSD: quote.carrierFeesUSD || 0,
          sterlingInsuranceServicesFeesUSD:
            quote.sterlingInsuranceServicesFeesUSD || 0,
          premiumTaxAmountUSD: quote.premiumTaxAmountUSD || 0,
          stampingFeeAmountUSD: quote.stampingFeeAmountUSD || 0,
          fireMarshalTaxAmountUSD: quote.fireMarshalTaxAmountUSD || 0,
          fireMarshalFlatFeeUSD: quote.fireMarshalFlatFeeUSD || 0,

          // ✅ ADD THIS LINE
          checkedDocuments: checkedDocs,
        };
      }),
      boundPolicy,
      activityLogs: activityLogs.map((log: any) => ({
        _id: log._id.toString(),
        submissionId: log.submissionId?.toString(),
        quoteId: log.quoteId?.toString(),
        activityType: log.activityType,
        description: log.description,
        details: log.details || {},
        performedBy: log.performedBy,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Submission details API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submission" },
      { status: 500 }
    );
  }
}



/**
 * PATCH /api/agency/submissions/[id]
 * Update submission (Modify mode)
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

    // Allow agency users and system admins to update submissions
    const userRole = (session.user as any).role;
    const isAdmin = userRole === "system_admin";
    if (userRole !== "agency_admin" && userRole !== "agency_user" && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Find submission — admin can edit any submission, agency users only their own
    const submission = await Submission.findOne(
      isAdmin
        ? { _id: params.id }
        : { _id: params.id, agencyId: (session.user as any).agencyId }
    );
    console.log("Current Submission Status:", submission.status);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Allow edit only if DRAFT or SUBMITTED
    // if (
    //   submission.status !== "DRAFT" &&
    //   submission.status !== "SUBMITTED"
    // ) {
    //   return NextResponse.json(
    //     { error: "Submission cannot be edited." },
    //     { status: 400 }
    //   );
    // }

    // Only prevent editing if BOUND (Removed per user request to allow post-bound mods)
    // if (submission.status === "BOUND") {
    //   return NextResponse.json(
    //     { error: "Bound submissions cannot be edited." },
    //     { status: 400 }
    //   );
    // }

    // ✅ Parse JSON body (matches your React frontend)
    const body = await req.json();

    if (body.programId) submission.programId = body.programId;
    if (body.programName) submission.programName = body.programName;

    // -----------------------------
    // Update Client Contact (if sent)
    // -----------------------------
    if (body.clientContact) {
      submission.clientContact = {
        ...submission.clientContact,
        ...body.clientContact,
      };

      if (body.clientContact.businessAddress?.state) {
        submission.state = body.clientContact.businessAddress.state;
      }
    }

    // -----------------------------
    // Update CCPA Consent
    // -----------------------------
    if (typeof body.ccpaConsent === "boolean") {
      submission.ccpaConsent = body.ccpaConsent;
    }

    // -----------------------------
    // Replace Entire Payload (Main Form Data)
    // -----------------------------
    if (body.payload) {
      const oldPayload = submission.payload || {};
      submission.payload = body.payload;
      if (body.payload.paymentOption) {
        submission.paymentOption = body.payload.paymentOption;
      }
      submission.markModified("payload");

      // Auto-sync clientContact if applicant details are present in payload
      const syncPhone = body.payload.applicantPhone || body.payload.phone;
      const syncEmail = body.payload.applicantEmail || body.payload.email;
      const syncName = (body.payload.firstName || body.payload.lastName)
        ? `${body.payload.firstName || ''} ${body.payload.lastName || ''}`.trim()
        : (body.payload.namedInsured || body.payload.companyName);

      if (!submission.clientContact) submission.clientContact = {} as any;
      if (syncPhone && (syncPhone !== "000-000-0000" || !submission.clientContact.phone || submission.clientContact.phone === "000-000-0000")) {
        submission.clientContact.phone = syncPhone;
      }
      if (syncEmail && (syncEmail !== "unknown@example.com" || !submission.clientContact.email || submission.clientContact.email === "unknown@example.com")) {
        submission.clientContact.email = syncEmail;
      }
      if (syncName) {
        submission.clientContact.name = syncName;
      }

      // Auto-sync Address
      const syncStreet = body.payload.streetAddress?.trim() || body.payload.applicantMailingAddress?.trim() || body.payload.mailingAddress?.trim();
      const syncCity = body.payload.city?.trim() || body.payload.mailingCity?.trim();
      const syncState = body.payload.state || body.payload.mailingState;
      const syncZip = body.payload.zip || body.payload.mailingZip;
      
      if (!submission.clientContact.businessAddress) {
        submission.clientContact.businessAddress = { street: "Unknown Street", city: "Unknown City", state: "CA", zip: "00000" };
      }
      
      if (syncStreet && syncStreet !== "Unknown Street") submission.clientContact.businessAddress.street = syncStreet;
      if (syncCity && syncCity !== "Unknown City") submission.clientContact.businessAddress.city = syncCity;
      if (syncState) submission.clientContact.businessAddress.state = syncState;
      if (syncZip && syncZip !== "00000") submission.clientContact.businessAddress.zip = syncZip;

      submission.markModified("clientContact");

      const XS_ADDED = (!oldPayload.addExcessLiability) && (body.payload.addExcessLiability === true);
      const XS_REMOVED = (oldPayload.addExcessLiability === true) && (body.payload.addExcessLiability === false);

      const GL_OPTIONAL_ADDED = (!oldPayload.addGeneralLiability) && (body.payload.addGeneralLiability === true);
      const GL_OPTIONAL_REMOVED = (oldPayload.addGeneralLiability === true) && (body.payload.addGeneralLiability === false);

      const PL_ADDED = (!oldPayload.addProfessionalLiability && oldPayload.professionalOrPollutionType !== "professional") &&
        (body.payload.addProfessionalLiability === true || body.payload.professionalOrPollutionType === "professional");
      const PL_REMOVED = (oldPayload.addProfessionalLiability === true || oldPayload.professionalOrPollutionType === "professional") &&
        (body.payload.addProfessionalLiability === false && body.payload.professionalOrPollutionType !== "professional");

      const POLLUTION_ADDED = (!oldPayload.addPollutionLiability && oldPayload.professionalOrPollutionType !== "pollution") &&
        (body.payload.addPollutionLiability === true || body.payload.professionalOrPollutionType === "pollution");
      const POLLUTION_REMOVED = (oldPayload.addPollutionLiability === true || oldPayload.professionalOrPollutionType === "pollution") &&
        (body.payload.addPollutionLiability === false && body.payload.professionalOrPollutionType !== "pollution");

      // 🗑️ CLEANUP: If Excess Liability, Professional Liability, Pollution Liability, or Optional GL is toggled OFF
      if (body.payload.addExcessLiability === false || body.payload.addGeneralLiability === false) {
        console.log(`[Cleanup] Removing EXCESS_LIABILITY quotes for submission ${params.id}`);
        await Quote.deleteMany({
          submissionId: params.id,
          policyType: "EXCESS_LIABILITY"
        });
      }

      if (PL_REMOVED) {
        console.log(`[Cleanup] Removing PROFESSIONAL_LIABILITY quotes for submission ${params.id}`);
        await Quote.deleteMany({
          submissionId: params.id,
          policyType: "PROFESSIONAL_LIABILITY"
        });
      }

      if (POLLUTION_REMOVED) {
        console.log(`[Cleanup] Removing POLLUTION_LIABILITY quotes for submission ${params.id}`);
        await Quote.deleteMany({
          submissionId: params.id,
          policyType: "POLLUTION_LIABILITY"
        });
      }

      if (body.payload.addExcessLiability === false || body.payload.addGeneralLiability === false || PL_REMOVED || POLLUTION_REMOVED) {
        // Ensure the submission status is consistent
        const remainingQuotesCount = await Quote.countDocuments({ submissionId: params.id });
        const currentStatus = submission.status as any;
        if (remainingQuotesCount === 0 && currentStatus === "QUOTED") {
          submission.status = "SUBMITTED";
        }
      }

      // 🔔 NOTIFICATIONS: If any policy was just ADDED
      const newlyAddedPolicies: { name: string; key: string }[] = [];
      if (XS_ADDED || GL_OPTIONAL_ADDED) {
        newlyAddedPolicies.push({
          name: GL_OPTIONAL_ADDED ? "General Liability" : "Excess Liability",
          key: GL_OPTIONAL_ADDED ? "GENERAL_LIABILITY_OPTIONAL" : "EXCESS_LIABILITY"
        });
      }
      if (PL_ADDED) {
        newlyAddedPolicies.push({ name: "Professional Liability", key: "PROFESSIONAL_LIABILITY" });
      }
      if (POLLUTION_ADDED) {
        newlyAddedPolicies.push({ name: "Pollution Liability", key: "POLLUTION_LIABILITY" });
      }

      for (const policy of newlyAddedPolicies) {
        console.log(`[Notification] ${policy.name} ADDED for submission ${params.id}`);
        
        const currentStatus = submission.status as any;
        if (currentStatus === "QUOTED") {
          submission.status = "SUBMITTED";
        }

        if (currentStatus === "BOUND") {
          console.log(`[PATCH] Setting hasNewEdits = true because new policy ${policy.name} was added to bound submission ${params.id}`);
          submission.hasNewEdits = true;
          await Submission.findByIdAndUpdate(params.id, { $set: { hasNewEdits: true } });
        }

        await logActivity(
          createActivityLogData(
            "APPROVAL_REQUESTED",
            `Policy Added: ${policy.name} (Quote Required)`,
            {
              submissionId: submission._id.toString(),
              user: {
                id: (session.user as any).id,
                name: (session.user as any).name || (session.user as any).email,
                email: (session.user as any).email,
                role: (session.user as any).role || "agency",
              },
              details: {
                addedPolicy: policy.key,
                requestId: submission.submissionNumber
              },
            }
          )
        );
      }

      // Log removal if it happened
      if (XS_REMOVED) {
        await logActivity(
          createActivityLogData(
            "SUBMISSION_UPDATED",
            "Policy Removed: Excess Liability",
            {
              submissionId: submission._id.toString(),
              user: {
                id: (session.user as any).id,
                name: (session.user as any).name || (session.user as any).email,
                email: (session.user as any).email,
                role: (session.user as any).role || "agency",
              },
              details: {
                removedPolicy: "EXCESS_LIABILITY"
              },
            }
          )
        );
      }
      if (PL_REMOVED) {
        await logActivity(
          createActivityLogData(
            "SUBMISSION_UPDATED",
            "Policy Removed: Professional Liability",
            {
              submissionId: submission._id.toString(),
              user: {
                id: (session.user as any).id,
                name: (session.user as any).name || (session.user as any).email,
                email: (session.user as any).email,
                role: (session.user as any).role || "agency",
              },
              details: {
                removedPolicy: "PROFESSIONAL_LIABILITY"
              },
            }
          )
        );
      }
      if (POLLUTION_REMOVED) {
        await logActivity(
          createActivityLogData(
            "SUBMISSION_UPDATED",
            "Policy Removed: Pollution Liability",
            {
              submissionId: submission._id.toString(),
              user: {
                id: (session.user as any).id,
                name: (session.user as any).name || (session.user as any).email,
                email: (session.user as any).email,
                role: (session.user as any).role || "agency",
              },
              details: {
                removedPolicy: "POLLUTION_LIABILITY"
              },
            }
          )
        );
      }

      // Sync clientContact.name from companyName/applicantName field if present
      const newName = body.payload.companyName || body.payload.applicantName;
      if (newName) {
        submission.clientContact = {
          ...submission.clientContact,
          name: newName,
        };
      }

      // Sync address if present
      if (body.payload.applicantMailingAddress) {
        submission.clientContact = {
          ...submission.clientContact,
          businessAddress: {
            ...submission.clientContact.businessAddress,
            street: body.payload.applicantMailingAddress,
          }
        };
      }

      // Sync remaining address fields from payload → clientContact.businessAddress
      if (body.payload.streetAddress) {
        submission.clientContact = {
          ...submission.clientContact,
          businessAddress: {
            ...submission.clientContact.businessAddress,
            street: body.payload.streetAddress,
          }
        };
      }
      if (body.payload.city) {
        submission.clientContact = {
          ...submission.clientContact,
          businessAddress: {
            ...submission.clientContact.businessAddress,
            city: body.payload.city,
          }
        };
      }
      if (body.payload.state) {
        submission.clientContact = {
          ...submission.clientContact,
          businessAddress: {
            ...submission.clientContact.businessAddress,
            state: body.payload.state,
          }
        };
      }
      if (body.payload.zip || body.payload.zipCode) {
        submission.clientContact = {
          ...submission.clientContact,
          businessAddress: {
            ...submission.clientContact.businessAddress,
            zip: body.payload.zip || body.payload.zipCode,
          }
        };
      }
    }

    // Save submission (timestamps auto update updatedAt)
    await submission.save();

    // -----------------------------
    // Activity Logging
    // -----------------------------
    await logActivity(
      createActivityLogData(
        "SUBMISSION_UPDATED",
        "Submission updated by agency",
        {
          submissionId: submission._id.toString(),
          user: {
            id: (session.user as any).id,
            name:
              (session.user as any).name ||
              (session.user as any).email,
            email: (session.user as any).email,
            role: (session.user as any).role || "agency",
          },
          details: {
            updatedAt: submission.updatedAt,
          },
        }
      )
    );

    return NextResponse.json({
      success: true,
      submission: {
        _id: submission._id.toString(),
        status: submission.status,
        updatedAt: submission.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update submission error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to update submission" },
      { status: 500 }
    );
  }
}