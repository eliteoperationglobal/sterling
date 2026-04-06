import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FormTemplate from "@/models/FormTemplate";

/**
 * GET /api/forms?industry=...&subtype=...&state=...
 * Get form templates filtered by industry, subtype, and optionally state
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const templateId = searchParams.get("templateId");
    const industry = searchParams.get("industry");
    const subtype = searchParams.get("subtype");
    const state = searchParams.get("state");

    // If templateId is provided, fetch by ID
    if (templateId) {
      const template = await FormTemplate.findById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        templates: [template],
        count: 1,
      });
    }

    let query: any = {};

    if (industry) {
      query.industry = industry;
    }

    if (subtype) {
      query.subtype = subtype;
    }

    // If state filter is passed (e.g., state=CA), prioritize state-specific templates
    if (state) {
      query.$or = [
        { stateSpecific: true, country: "US" },
        { country: "US" },
      ];
    }

    const templates = await FormTemplate.find(query).sort({
      stateSpecific: -1, // State-specific first if state filter is used
      industry: 1,
      subtype: 1,
    });

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error("Forms API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

