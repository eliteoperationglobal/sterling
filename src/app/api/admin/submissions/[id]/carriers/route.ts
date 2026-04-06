import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import RoutingLog from "@/models/RoutingLog";
import Carrier from "@/models/Carrier";

/**
 * GET /api/admin/submissions/[id]/carriers
 * Get carriers that were routed for this submission
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

    const userRole = (session.user as any).role;
    // Only system_admin can access admin APIs
    if (userRole !== "system_admin") {
      return NextResponse.json(
        { error: "Forbidden - System admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Import models to ensure they're registered for populate
    await import("@/models/Carrier");
    await import("@/models/Submission");
    const Submission = (await import("@/models/Submission")).default;

    // First, try to get carriers from routing logs
    const routingLogs = await RoutingLog.find({
      submissionId: params.id,
      status: "SENT", // Only carriers that were successfully notified
    })
      .populate("carrierId")
      .lean();

    // Extract unique carriers from routing logs
    const carrierMap = new Map();
    routingLogs.forEach((log: any) => {
      if (log.carrierId) {
        const carrierId = log.carrierId._id.toString();
        if (!carrierMap.has(carrierId)) {
          carrierMap.set(carrierId, {
            _id: carrierId,
            name: log.carrierId.name,
            email: log.carrierId.email,
            wholesaleFeePercent: log.carrierId.wholesaleFeePercent,
          });
        }
      }
    });

    // If no carriers from routing logs, get submission and find carriers by state/industry
    if (carrierMap.size === 0) {
      const submission = await Submission.findById(params.id)
        .populate("templateId")
        .lean();
      
      if (submission) {
        const subState = (submission as any).state || "CA";
        const template = (submission as any).templateId;
        const industry = template?.industry;
        
        // Find carriers that serve this state
        const allCarriers = await Carrier.find({
          statesServed: { $in: [subState] },
        }).lean();
        
        // If industry is available, filter by industry too
        let matchingCarriers = allCarriers;
        if (industry) {
          matchingCarriers = allCarriers.filter((carrier: any) => 
            !carrier.industries || carrier.industries.length === 0 || carrier.industries.includes(industry)
          );
        }
        
        // Add to carrier map
        matchingCarriers.forEach((carrier: any) => {
          const carrierId = carrier._id.toString();
          carrierMap.set(carrierId, {
            _id: carrierId,
            name: carrier.name,
            email: carrier.email,
            wholesaleFeePercent: carrier.wholesaleFeePercent,
          });
        });
      }
    }

    // If still no carriers, return all carriers as fallback
    if (carrierMap.size === 0) {
      const allCarriers = await Carrier.find({}).lean();
      allCarriers.forEach((carrier: any) => {
        const carrierId = carrier._id.toString();
        carrierMap.set(carrierId, {
          _id: carrierId,
          name: carrier.name,
          email: carrier.email,
          wholesaleFeePercent: carrier.wholesaleFeePercent,
        });
      });
    }

    const carriers = Array.from(carrierMap.values());
    
    console.log(`[Carriers API] Found ${carriers.length} carriers for submission ${params.id}`);

    return NextResponse.json({
      carriers,
      count: carriers.length,
    });
  } catch (error: any) {
    console.error("Carriers fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch carriers" },
      { status: 500 }
    );
  }
}

