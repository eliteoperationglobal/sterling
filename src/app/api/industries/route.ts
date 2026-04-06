import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Industry from "@/models/Industry";
import FormTemplate from "@/models/FormTemplate";

/**
 * GET /api/industries?state=...
 * Get all industries with their subtypes and state-specific flags
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state");

    // Get industries from Industry collection, or derive from FormTemplates if none exist
    let industries = await Industry.find({}).sort({ name: 1 });

    // If no industries in Industry collection, derive from FormTemplates
    if (industries.length === 0) {
      const templates = await FormTemplate.find({}).distinct("industry");
      industries = templates.map((name) => ({
        name,
        subtypes: [],
      })) as any;
    }

    // Enrich with state-specific information from FormTemplates
    const industriesWithFlags = await Promise.all(
      industries.map(async (industry: any) => {
        const templates = await FormTemplate.find({
          industry: industry.name || industry,
        });

        const subtypes = templates.map((t) => ({
          name: t.subtype,
          stateSpecific: t.stateSpecific,
          templateId: t._id,
        }));

        // Get unique subtypes
        const uniqueSubtypes = subtypes.filter(
          (subtype, index, self) =>
            index === self.findIndex((s) => s.name === subtype.name)
        );

        return {
          name: industry.name || industry,
          subtypes: uniqueSubtypes,
          hasStateSpecific: templates.some((t) => t.stateSpecific),
        };
      })
    );

    // If state filter is provided, prioritize state-specific templates
    if (state) {
      industriesWithFlags.forEach((industry) => {
        industry.subtypes.sort((a, b) => {
          if (a.stateSpecific && !b.stateSpecific) return -1;
          if (!a.stateSpecific && b.stateSpecific) return 1;
          return 0;
        });
      });
    }

    return NextResponse.json({
      industries: industriesWithFlags,
      count: industriesWithFlags.length,
    });
  } catch (error: any) {
    console.error("Industries API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch industries" },
      { status: 500 }
    );
  }
}

