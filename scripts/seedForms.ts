// Load .env.local file FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import modules that need environment variables
import connectDB from "../src/lib/mongodb";
import FormTemplate from "../src/models/FormTemplate";
import Industry from "../src/models/Industry";

/**
 * Seed CA-specific form templates:
 * 1. Restaurant (Hospitality → Restaurant)
 * 2. Contractor (Construction → Contractor)
 * 3. Trucking (Transportation → Trucking)
 */
async function seedForms() {
  try {
    await connectDB();
    console.log("🌱 Seeding form templates...");

    // Seed Industries first
    await Industry.findOneAndUpdate(
      { name: "Hospitality" },
      { name: "Hospitality", subtypes: ["Restaurant", "Bar", "Tavern", "Hotel"] },
      { upsert: true }
    );

    await Industry.findOneAndUpdate(
      { name: "Construction" },
      { name: "Construction", subtypes: ["Contractor", "General", "Electrical", "Plumbing"] },
      { upsert: true }
    );

    await Industry.findOneAndUpdate(
      { name: "Transportation" },
      { name: "Transportation", subtypes: ["Trucking", "Logistics", "Fleet"] },
      { upsert: true }
    );

    // 1. Restaurant Template
    const restaurantTemplate = {
      industry: "Hospitality",
      subtype: "Restaurant",
      title: "Restaurant Insurance Application",
      description: "Complete application for restaurant insurance coverage in California",
      country: "US",
      stateSpecific: true,
      fields: [
        {
          key: "business_name",
          label: "Business Name",
          type: "text",
          required: true,
          placeholder: "Enter your restaurant name",
        },
        {
          key: "health_permit_number",
          label: "CA Health Permit #",
          type: "text",
          required: true,
          helpText: "California Health Permit number (required for food service operations)",
          placeholder: "e.g., HP-12345",
        },
        {
          key: "seating_capacity",
          label: "Seating Capacity",
          type: "number",
          required: true,
          helpText: "Total number of seats in your restaurant",
          placeholder: "e.g., 50",
        },
        {
          key: "serves_alcohol",
          label: "Do you serve alcohol?",
          type: "boolean",
          required: true,
        },
        {
          key: "liquor_license_number",
          label: "Liquor License Number",
          type: "text",
          required: false,
          conditional: {
            field: "serves_alcohol",
            value: true,
          },
          helpText: "Required if you serve alcohol",
          placeholder: "e.g., ABC-12345",
        },
        {
          key: "uses_lpg",
          label: "Do you use LPG (Liquefied Petroleum Gas)?",
          type: "boolean",
          required: true,
        },
        {
          key: "lpg_safety_certificate",
          label: "LPG Safety Certificate",
          type: "file",
          required: false,
          conditional: {
            field: "uses_lpg",
            value: true,
          },
          helpText: "Upload your LPG safety certificate (PDF, max 5MB)",
        },
        {
          key: "annual_gross_receipts_usd",
          label: "Annual Gross Receipts (USD)",
          type: "number",
          required: true,
          helpText: "Total annual revenue in USD",
          placeholder: "e.g., 500000",
        },
        {
          key: "established_year",
          label: "Year Established",
          type: "number",
          required: true,
          helpText: "Year the business was established",
          placeholder: "e.g., 2010",
        },
      ],
    };

    // 2. Contractor Template
    const contractorTemplate = {
      industry: "Construction",
      subtype: "Contractor",
      title: "Contractor Insurance Application",
      description: "Complete application for contractor insurance coverage in California",
      country: "US",
      stateSpecific: true,
      fields: [
        {
          key: "company_name",
          label: "Company Name",
          type: "text",
          required: true,
          placeholder: "Enter your company name",
        },
        {
          key: "cslb_license_number",
          label: "California CSLB License #",
          type: "text",
          required: true,
          helpText: "CSLB license format: A-B 12345 (e.g., A-B 12345)",
          placeholder: "e.g., A-B 12345",
        },
        {
          key: "trade_type",
          label: "Trade Type",
          type: "select",
          required: true,
          options: ["General", "Electrical", "Plumbing", "Civil"],
          helpText: "Select your primary trade type",
        },
        {
          key: "annual_turnover_usd",
          label: "Annual Turnover (USD)",
          type: "number",
          required: true,
          helpText: "Total annual revenue in USD",
          placeholder: "e.g., 1000000",
        },
        {
          key: "number_of_workers",
          label: "Number of Workers",
          type: "number",
          required: true,
          helpText: "Total number of employees",
          placeholder: "e.g., 25",
        },
        {
          key: "has_subcontractors",
          label: "Do you use subcontractors?",
          type: "boolean",
          required: true,
        },
        {
          key: "subcontractor_details",
          label: "Subcontractor Details",
          type: "textarea",
          required: false,
          conditional: {
            field: "has_subcontractors",
            value: true,
          },
          helpText: "Provide details about your subcontractors",
          placeholder: "Describe subcontractor relationships...",
        },
        {
          key: "carries_workers_comp",
          label: "Do you carry Workers' Compensation insurance?",
          type: "boolean",
          required: true,
        },
      ],
    };

    // 3. Trucking Template
    const truckingTemplate = {
      industry: "Transportation",
      subtype: "Trucking",
      title: "Trucking Insurance Application",
      description: "Complete application for trucking insurance coverage in California",
      country: "US",
      stateSpecific: true,
      fields: [
        {
          key: "fleet_size",
          label: "Fleet Size",
          type: "number",
          required: true,
          helpText: "Total number of vehicles in your fleet",
          placeholder: "e.g., 10",
        },
        {
          key: "usdot_number",
          label: "USDOT Number",
          type: "text",
          required: true,
          helpText: "USDOT # required for interstate/CA operations",
          placeholder: "e.g., 1234567",
        },
        {
          key: "ca_motor_carrier_permit",
          label: "CA Motor Carrier Permit (Optional)",
          type: "text",
          required: false,
          helpText: "California Motor Carrier Permit number (if applicable)",
          placeholder: "e.g., MCP-12345",
        },
        {
          key: "avg_vehicle_age_years",
          label: "Average Vehicle Age (Years)",
          type: "number",
          required: true,
          helpText: "Average age of vehicles in your fleet",
          placeholder: "e.g., 5",
        },
        {
          key: "goods_type",
          label: "Type of Goods Transported",
          type: "select",
          required: true,
          options: ["Hazardous", "Perishable", "General"],
          helpText: "Select the primary type of goods you transport",
        },
        {
          key: "has_previous_accidents_5yr",
          label: "Any accidents in the last 5 years?",
          type: "boolean",
          required: true,
        },
        {
          key: "accident_history",
          label: "Accident History Details",
          type: "textarea",
          required: false,
          conditional: {
            field: "has_previous_accidents_5yr",
            value: true,
          },
          helpText: "Provide details about any accidents in the last 5 years",
          placeholder: "Describe accident history...",
        },
      ],
    };

    // Insert or update templates
    await FormTemplate.findOneAndUpdate(
      { industry: "Hospitality", subtype: "Restaurant" },
      restaurantTemplate,
      { upsert: true }
    );
    console.log("✅ Restaurant template seeded");

    await FormTemplate.findOneAndUpdate(
      { industry: "Construction", subtype: "Contractor" },
      contractorTemplate,
      { upsert: true }
    );
    console.log("✅ Contractor template seeded");

    await FormTemplate.findOneAndUpdate(
      { industry: "Transportation", subtype: "Trucking" },
      truckingTemplate,
      { upsert: true }
    );
    console.log("✅ Trucking template seeded");

    console.log("✨ Form templates seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding forms:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedForms()
    .then(() => {
      console.log("✅ Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export default seedForms;

