// ⭐ IMPORTANT — dotenv must load FIRST (ESM safe)
import "dotenv/config";

import connectDB from "../src/lib/mongodb";
import Agency from "../src/models/Agency";
import User from "../src/models/User";
import { hashPassword } from "../src/lib/auth";

/**
 * Seed script for SJJ Insurance Services
 */
async function seedSJJ() {
  try {
    await connectDB();
    console.log("🌱 Seeding SJJ Insurance Services...");

    // ⭐ 1. Create Agency
    const agency = await Agency.findOneAndUpdate(
      { email: "info@sjjinsurance.com" },
      {
        name: "SJJ Insurance Services",
        email: "info@sjjinsurance.com",
        address: {
          street: "8635 W. Sahara Ave. PMB Box #7",
          city: "Las Vegas",
          state: "NV",
          zip: "89117",
        },
        phone: "310-220-1019",
        allowedStates: ["NV", "CA"],
      },
      { upsert: true, new: true }
    );

    console.log("✅ Agency created:", agency.name);

    // ⭐ 2. Create Admin User
    const passwordHash = await hashPassword("SJJ@2026");

    const adminUser = await User.findOneAndUpdate(
      { email: "admin@sjjinsurance.com" },
      {
        agencyId: agency._id,
        name: "SJJ Admin",
        email: "admin@sjjinsurance.com",
        passwordHash,
        role: "agency_admin",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin user created:", adminUser.email);

    console.log("\n✨ SJJ Insurance Services seeded!\n");
    console.log("📝 Login Credentials:");
    console.log("   admin@sjjinsurance.com / SJJ@2026");

  } catch (error) {
    console.error("❌ Error seeding SJJ:", error);
    throw error;
  }
}

seedSJJ()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));