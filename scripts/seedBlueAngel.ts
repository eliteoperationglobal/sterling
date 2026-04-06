// Load .env.local FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

const envPath = resolve(process.cwd(), ".env.local");
console.log("🔍 Looking for .env.local at:", envPath);
console.log("📁 File exists:", existsSync(envPath));

const result = config({ path: envPath });
if (result.error) {
  console.error("❌ Error loading .env.local:", result.error);
} else {
  console.log("✅ .env.local loaded");
  console.log("🔑 MONGODB_URI exists:", !!process.env.MONGODB_URI);
}

import connectDB from "../src/lib/mongodb";
import Agency from "../src/models/Agency";
import User from "../src/models/User";
import { hashPassword } from "../src/lib/auth";
import Submission from "../src/models/Submission";
import FormTemplate from "../src/models/FormTemplate";

/**
 * Seed script for Blue Angel Insurance agency
 * Creates:
 *  - 1 agency: Blue Angel Insurance (San Diego, CA)
 *  - 2 users: agency_admin + agency_user
 *  - 4 submissions with different pipeline statuses
 */
async function seedBlueAngel() {
  try {
    await connectDB();
    console.log("🌱 Seeding Blue Angel Insurance...");

    // 1. Create Agency
    const agency = await Agency.findOneAndUpdate(
      { email: "info@blueangel.com" },
      {
        name: "Blue Angel Insurance",
        email: "info@blueangel.com",
        address: {
          street: "800 Pacific Blvd",
          city: "San Diego",
          state: "CA",
          zip: "92101",
        },
        phone: "619-555-0800",
        allowedStates: ["CA", "AZ", "NV"],
      },
      { upsert: true, new: true }
    );
    console.log("✅ Agency created:", agency.name);

    // 2. Create Users
    const passwordHash = await hashPassword("BlueAngel@2025");

    const adminUser = await User.findOneAndUpdate(
      { email: "admin@blueangel.com" },
      {
        agencyId: agency._id,
        name: "Blue Angel Admin",
        email: "admin@blueangel.com",
        passwordHash,
        role: "agency_admin",
      },
      { upsert: true, new: true }
    );
    console.log("✅ Admin user created:", adminUser.email);

    const regularUser = await User.findOneAndUpdate(
      { email: "user@blueangel.com" },
      {
        agencyId: agency._id,
        name: "Blue Angel User",
        email: "user@blueangel.com",
        passwordHash,
        role: "agency_user",
      },
      { upsert: true, new: true }
    );
    console.log("✅ Regular user created:", regularUser.email);

    // 3. Get form templates
    const constructionTemplate = await FormTemplate.findOne({
      industry: "Construction",
    });
    const hospitalityTemplate = await FormTemplate.findOne({
      industry: "Hospitality",
    });
    const transportationTemplate = await FormTemplate.findOne({
      industry: "Transportation",
    });

    if (!constructionTemplate || !hospitalityTemplate || !transportationTemplate) {
      console.warn(
        "⚠️  Some form templates not found — run seedForms first. Skipping submissions."
      );
      console.log("\n✨ Blue Angel Insurance seeded (agency + users only)!\n");
      console.log("📝 Login Credentials:");
      console.log("   Agency Admin : admin@blueangel.com / BlueAngel@2025");
      console.log("   Agency User  : user@blueangel.com  / BlueAngel@2025");
      return;
    }

    // 4. Seed Submissions

    // Submission 1 — Construction → SUBMITTED (In Progress)
    await Submission.findOneAndUpdate(
      { "clientContact.email": "calibuilders@blueangel-demo.com" },
      {
        agencyId: agency._id,
        templateId: constructionTemplate._id,
        payload: {
          company_name: "Cali Builders Inc.",
          cslb_license_number: "B-55001",
          trade_type: "General",
          annual_turnover_usd: 1200000,
          number_of_workers: 30,
          has_subcontractors: true,
          subcontractor_details: "Plumbing and electrical subs",
          carries_workers_comp: true,
        },
        files: [],
        status: "SUBMITTED",
        clientContact: {
          name: "Cali Builders Inc.",
          phone: "619-555-1001",
          email: "calibuilders@blueangel-demo.com",
          EIN: "32-1001001",
          businessAddress: {
            street: "101 Builder Way",
            city: "San Diego",
            state: "CA",
            zip: "92101",
          },
        },
        ccpaConsent: true,
        state: "CA",
      },
      { upsert: true, new: true }
    );
    console.log("   1. Cali Builders Inc.   - Construction  → SUBMITTED");

    // Submission 2 — Hospitality → QUOTED (Approved Quote)
    await Submission.findOneAndUpdate(
      { "clientContact.email": "sunsetbistro@blueangel-demo.com" },
      {
        agencyId: agency._id,
        templateId: hospitalityTemplate._id,
        payload: {
          business_name: "Sunset Bistro & Bar",
          health_permit_number: "HP-98001",
          seating_capacity: 80,
          serves_alcohol: true,
          liquor_license_number: "LQ-44321",
          uses_lpg: false,
          annual_gross_receipts_usd: 900000,
          established_year: 2018,
        },
        files: [],
        status: "QUOTED",
        clientContact: {
          name: "Sunset Bistro & Bar",
          phone: "619-555-2002",
          email: "sunsetbistro@blueangel-demo.com",
          EIN: "32-1002002",
          businessAddress: {
            street: "202 Ocean View Dr",
            city: "San Diego",
            state: "CA",
            zip: "92103",
          },
        },
        ccpaConsent: true,
        state: "CA",
      },
      { upsert: true, new: true }
    );
    console.log("   2. Sunset Bistro & Bar  - Hospitality   → QUOTED");

    // Submission 3 — Transportation → BIND_REQUESTED
    await Submission.findOneAndUpdate(
      { "clientContact.email": "sdfleet@blueangel-demo.com" },
      {
        agencyId: agency._id,
        templateId: transportationTemplate._id,
        payload: {
          fleet_size: 15,
          usdot_number: "7654321",
          ca_motor_carrier_permit: "MCP-98765",
          avg_vehicle_age_years: 4,
          goods_type: "General Freight",
          has_previous_accidents_5yr: false,
        },
        files: [],
        status: "BIND_REQUESTED",
        clientContact: {
          name: "SD Fleet Logistics",
          phone: "619-555-3003",
          email: "sdfleet@blueangel-demo.com",
          EIN: "32-1003003",
          businessAddress: {
            street: "303 Harbor Blvd",
            city: "Chula Vista",
            state: "CA",
            zip: "91910",
          },
        },
        ccpaConsent: true,
        state: "CA",
      },
      { upsert: true, new: true }
    );
    console.log("   3. SD Fleet Logistics   - Transportation → BIND_REQUESTED");

    // Submission 4 — Construction → BOUND (Newly Bound)
    await Submission.findOneAndUpdate(
      { "clientContact.email": "aztechelectric@blueangel-demo.com" },
      {
        agencyId: agency._id,
        templateId: constructionTemplate._id,
        payload: {
          company_name: "AZ Tech Electric",
          cslb_license_number: "C-10-77001",
          trade_type: "Electrical",
          annual_turnover_usd: 600000,
          number_of_workers: 12,
          has_subcontractors: false,
          carries_workers_comp: true,
        },
        files: [],
        status: "BOUND",
        clientContact: {
          name: "AZ Tech Electric",
          phone: "619-555-4004",
          email: "aztechelectric@blueangel-demo.com",
          EIN: "32-1004004",
          businessAddress: {
            street: "404 Electric Ave",
            city: "El Cajon",
            state: "CA",
            zip: "92020",
          },
        },
        ccpaConsent: true,
        state: "CA",
      },
      { upsert: true, new: true }
    );
    console.log("   4. AZ Tech Electric     - Construction  → BOUND");

    console.log("\n✨ Blue Angel Insurance fully seeded!\n");
    console.log("📝 Login Credentials:");
    console.log("   Agency Admin : admin@blueangel.com / BlueAngel@2025");
    console.log("   Agency User  : user@blueangel.com  / BlueAngel@2025");
    console.log("\n📋 Their Dashboard Shows:");
    console.log("   1. Cali Builders Inc.   - Construction  → In Progress");
    console.log("   2. Sunset Bistro & Bar  - Hospitality   → Approved Quote");
    console.log("   3. SD Fleet Logistics   - Transportation → Bind Requested");
    console.log("   4. AZ Tech Electric     - Construction  → Newly Bound");
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error seeding Blue Angel:", error);
    throw error;
  }
}

if (require.main === module) {
  seedBlueAngel()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedBlueAngel;
