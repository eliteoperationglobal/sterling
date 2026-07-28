// ⭐ IMPORTANT — dotenv must load FIRST (ESM safe)
import "dotenv/config";

import connectDB from "../src/lib/mongodb";
import Agency from "../src/models/Agency";
import User from "../src/models/User";
import { hashPassword } from "../src/lib/auth";

/**
 * Seed script for Texas Commercial Liability Services
 */
async function seedTexasComm() {
  try {
    await connectDB();
    console.log("🌱 Seeding Texas Commercial Liability Services...");

    // ⭐ 1. Create Agency
    const agency = await Agency.findOneAndUpdate(
      { email: "Cs@capcoinsurance.com" },
      {
        name: "Texas Commercial Liability Services",
        email: "Cs@capcoinsurance.com",
        address: {
          street: "615 E. Abram St., Suite C",
          city: "Arlington",
          state: "TX",
          zip: "76010",
        },
        phone: "817-861-1200",
        allowedStates: ["TX"],
      },
      { upsert: true, new: true }
    );

    console.log("✅ Agency created:", agency.name);

    // ⭐ 2. Create Admin User
    const passwordHash = await hashPassword("Texas@2211");

    const adminUser = await User.findOneAndUpdate(
      { email: "texascomm@services.com" },
      {
        agencyId: agency._id,
        name: "Texas Commercial Liability Services",
        email: "texascomm@services.com",
        passwordHash,
        role: "agency_admin",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin user created:", adminUser.email);

    console.log("\n✨ Texas Commercial Liability Services seeded!\n");
    console.log("📝 Login Credentials:");
    console.log("   texascomm@services.com / Texas@2211");

  } catch (error) {
    console.error("❌ Error seeding Texas Commercial Liability Services:", error);
    throw error;
  }
}

seedTexasComm()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
