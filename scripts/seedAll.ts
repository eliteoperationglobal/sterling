// Load .env.local file FIRST before any other imports
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

// Now import modules that need environment variables
import connectDB from "../src/lib/mongodb";
import Agency from "../src/models/Agency";
import User from "../src/models/User";
import { hashPassword } from "../src/lib/auth";
import seedForms from "./seedForms";
import Carrier from "../src/models/Carrier";
import Submission from "../src/models/Submission";
import Quote from "../src/models/Quote";
import Policy from "../src/models/Policy";
import FormTemplate from "../src/models/FormTemplate";

/**
 * Complete seed script:
 * - 2 agencies (one CA-only)
 * - 3 users (agency_admin + agency_user + system_admin)
 * - 3 form templates (Restaurant, Contractor, Trucking)
 * - 2 carriers (one serving CA)
 * - 5 sample submissions (various statuses)
 * - 2 sample quotes
 * - 1 sample policy
 */
async function seedAll() {
  try {
    await connectDB();
    console.log("🌱 Starting complete database seed...");

    // 1. Seed Industries and Form Templates
    await seedForms();

    // 2. Seed Agencies
    const agency1 = await Agency.findOneAndUpdate(
      { email: "agency1@example.com" },
      {
        name: "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services",
        email: "agency1@example.com",
        address: {
          street: "123 Main St",
          city: "Los Angeles",
          state: "CA",
          zip: "90001",
        },
        phone: "555-0101",
        allowedStates: ["CA"],
      },
      { upsert: true, new: true }
    );
    console.log("✅ Agency 1 seeded:", agency1.name);

    const agency2 = await Agency.findOneAndUpdate(
      { email: "agency2@example.com" },
      {
        name: "West Coast Brokers",
        email: "agency2@example.com",
        address: {
          street: "456 Oak Ave",
          city: "San Francisco",
          state: "CA",
          zip: "94102",
        },
        phone: "555-0202",
        allowedStates: ["CA", "NV", "OR"],
      },
      { upsert: true, new: true }
    );
    console.log("✅ Agency 2 seeded:", agency2.name);

    // 3. Seed Users
    const passwordHash = await hashPassword("password123");

    const user1 = await User.findOneAndUpdate(
      { email: "admin@agency1.com" },
      {
        agencyId: agency1._id,
        name: "John Admin",
        email: "admin@agency1.com",
        passwordHash,
        role: "agency_admin",
      },
      { upsert: true, new: true }
    );
    console.log("✅ User 1 seeded (agency_admin):", user1.email);

    const user2 = await User.findOneAndUpdate(
      { email: "user@agency1.com" },
      {
        agencyId: agency1._id,
        name: "Jane User",
        email: "user@agency1.com",
        passwordHash,
        role: "agency_user",
      },
      { upsert: true, new: true }
    );
    console.log("✅ User 2 seeded (agency_user):", user2.email);

    // System admin (no agency)
    const systemAdminAgency = await Agency.findOneAndUpdate(
      { email: "system@sterling.com" },
      {
        name: "Sterling Wholesale Insurance",
        email: "system@sterling.com",
        address: {
          street: "789 Corporate Blvd",
          city: "Los Angeles",
          state: "CA",
          zip: "90012",
        },
        phone: "555-0000",
        allowedStates: ["CA"],
      },
      { upsert: true, new: true }
    );

    const user3 = await User.findOneAndUpdate(
      { email: "admin@sterling.com" },
      {
        agencyId: systemAdminAgency._id,
        name: "System Administrator",
        email: "admin@sterling.com",
        passwordHash,
        role: "system_admin",
      },
      { upsert: true, new: true }
    );
    console.log("✅ User 3 seeded (system_admin):", user3.email);

    // 4. Seed Carriers
    const carrier1 = await Carrier.findOneAndUpdate(
      { name: "Richmond National Insurance" },
      {
        name: "Richmond National Insurance",
        email: "underwriting@richmondnational.com",
        address: {
          street: "11013 West Broad Street, Suite 300",
          city: "Glen Allen",
          state: "VA",
          zip: "23060",
        },
        statesServed: ["CA", "NV", "OR", "WA", "TX", "FL", "NY", "VA"],
        industries: ["Hospitality", "Construction"],
        wholesaleFeePercent: 15,
      },
      { upsert: true, new: true }
    );
    console.log("✅ Carrier 1 seeded:", carrier1.name);

    const carrier2 = await Carrier.findOneAndUpdate(
      { name: "Kinsale Insurance Company" },
      {
        name: "Kinsale Insurance Company",
        email: "quotes@kinsale.com",
        address: {
          street: "2025 Staples Mill Rd",
          city: "Richmond",
          state: "VA",
          zip: "23230",
        },
        statesServed: ["CA", "VA", "TX", "FL", "NY"],
        industries: ["Transportation", "Construction"],
        wholesaleFeePercent: 12,
      },
      { upsert: true, new: true }
    );
    console.log("✅ Carrier 2 seeded:", carrier2.name);

    // 5. Seed Sample Submissions
    const restaurantTemplate = await FormTemplate.findOne({
      industry: "Hospitality",
      subtype: "Restaurant",
    });
    const contractorTemplate = await FormTemplate.findOne({
      industry: "Construction",
      subtype: "Contractor",
    });
    const truckingTemplate = await FormTemplate.findOne({
      industry: "Transportation",
      subtype: "Trucking",
    });

    if (restaurantTemplate && contractorTemplate && truckingTemplate) {
      // Submission 1: Restaurant - SUBMITTED
      await Submission.findOneAndUpdate(
        { "clientContact.email": "restaurant@example.com" },
        {
          agencyId: agency1._id,
          templateId: restaurantTemplate._id,
          payload: {
            business_name: "Joe's Pizza",
            health_permit_number: "HP-12345",
            seating_capacity: 50,
            serves_alcohol: true,
            liquor_license_number: "ABC-67890",
            uses_lpg: false,
            annual_gross_receipts_usd: 500000,
            established_year: 2010,
          },
          files: [],
          status: "SUBMITTED",
          clientContact: {
            name: "Joe Smith",
            phone: "555-1001",
            email: "restaurant@example.com",
            EIN: "12-3456789",
            businessAddress: {
              street: "100 Food St",
              city: "Los Angeles",
              state: "CA",
              zip: "90001",
            },
          },
          ccpaConsent: true,
          state: "CA",
        },
        { upsert: true, new: true }
      );

      // Submission 2: Contractor - ROUTED
      await Submission.findOneAndUpdate(
        { "clientContact.email": "contractor@example.com" },
        {
          agencyId: agency1._id,
          templateId: contractorTemplate._id,
          payload: {
            company_name: "ABC Construction",
            cslb_license_number: "A-B 12345",
            trade_type: "General",
            annual_turnover_usd: 1000000,
            number_of_workers: 25,
            has_subcontractors: true,
            subcontractor_details: "We use 3-5 subcontractors for specialized work",
            carries_workers_comp: true,
          },
          files: [],
          status: "ROUTED",
          clientContact: {
            name: "Bob Builder",
            phone: "555-2002",
            email: "contractor@example.com",
            EIN: "98-7654321",
            businessAddress: {
              street: "200 Build Ave",
              city: "San Francisco",
              state: "CA",
              zip: "94102",
            },
          },
          ccpaConsent: true,
          state: "CA",
        },
        { upsert: true, new: true }
      );

      // Submission 3: Trucking - QUOTED
      const truckingSubmission = await Submission.findOneAndUpdate(
        { "clientContact.email": "trucking@example.com" },
        {
          agencyId: agency2._id,
          templateId: truckingTemplate._id,
          payload: {
            fleet_size: 10,
            usdot_number: "1234567",
            ca_motor_carrier_permit: "MCP-12345",
            avg_vehicle_age_years: 5,
            goods_type: "General",
            has_previous_accidents_5yr: false,
          },
          files: [],
          status: "QUOTED",
          clientContact: {
            name: "Truck Driver Co",
            phone: "555-3003",
            email: "trucking@example.com",
            businessAddress: {
              street: "300 Truck Way",
              city: "Sacramento",
              state: "CA",
              zip: "95814",
            },
          },
          ccpaConsent: true,
          state: "CA",
        },
        { upsert: true, new: true }
      );

      // Submission 4: Restaurant - BIND_REQUESTED
      await Submission.findOneAndUpdate(
        { "clientContact.email": "restaurant2@example.com" },
        {
          agencyId: agency2._id,
          templateId: restaurantTemplate._id,
          payload: {
            business_name: "Fine Dining Restaurant",
            health_permit_number: "HP-54321",
            seating_capacity: 100,
            serves_alcohol: true,
            liquor_license_number: "ABC-11111",
            uses_lpg: true,
            annual_gross_receipts_usd: 2000000,
            established_year: 2015,
          },
          files: [],
          status: "BIND_REQUESTED",
          clientContact: {
            name: "Fine Dining LLC",
            phone: "555-4004",
            email: "restaurant2@example.com",
            businessAddress: {
              street: "400 Fine St",
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

      // Submission 5: Contractor - BOUND
      const boundSubmission = await Submission.findOneAndUpdate(
        { "clientContact.email": "contractor2@example.com" },
        {
          agencyId: agency1._id,
          templateId: contractorTemplate._id,
          payload: {
            company_name: "XYZ Electric",
            cslb_license_number: "C-10 99999",
            trade_type: "Electrical",
            annual_turnover_usd: 750000,
            number_of_workers: 15,
            has_subcontractors: false,
            carries_workers_comp: true,
          },
          files: [],
          status: "BOUND",
          clientContact: {
            name: "Electric Co",
            phone: "555-5005",
            email: "contractor2@example.com",
            businessAddress: {
              street: "500 Power Ave",
              city: "Oakland",
              state: "CA",
              zip: "94601",
            },
          },
          ccpaConsent: true,
          state: "CA",
        },
        { upsert: true, new: true }
      );

      console.log("✅ 5 sample submissions seeded");

      // 6. Seed Sample Quotes
      if (truckingSubmission) {
        await Quote.findOneAndUpdate(
          { submissionId: truckingSubmission._id },
          {
            submissionId: truckingSubmission._id,
            carrierId: carrier2._id,
            carrierQuoteUSD: 15000,
            wholesaleFeePercent: 12,
            wholesaleFeeAmountUSD: 1800,
            brokerFeeAmountUSD: 0,
            finalAmountUSD: 16800,
            status: "APPROVED",
          },
          { upsert: true, new: true }
        );
        console.log("✅ Quote 1 seeded");
      }

      // 7. Seed Sample Policy
      if (boundSubmission) {
        await Policy.findOneAndUpdate(
          { submissionId: boundSubmission._id },
          {
            submissionId: boundSubmission._id,
            policyNumber: "POL-2025-001",
            carrierId: carrier1._id,
            issuedDate: new Date(),
            fileUrl: "/uploads/policies/policy-001.pdf",
            status: "ISSUED",
          },
          { upsert: true, new: true }
        );
        console.log("✅ Policy 1 seeded");
      }
    }

    console.log("✨ Complete database seed finished!");
    console.log("\n📝 Test Credentials:");
    console.log("  Agency Admin: admin@agency1.com / password123");
    console.log("  Agency User: user@agency1.com / password123");
    console.log("  System Admin: admin@sterling.com / password123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export default seedAll;

