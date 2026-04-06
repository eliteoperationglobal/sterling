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

/**
 * Seed script for Patrick Arias Insurance
 * Creates:
 *  - 1 agency: Patrick Arias Insurance (Coachella, CA)
 *  - 1 user: agency_admin
 */
async function seedPatrickArias() {
    try {
        await connectDB();
        console.log("🌱 Seeding Patrick Arias Insurance...");

        // 1. Create Agency
        const agency = await Agency.findOneAndUpdate(
            { email: "patrick@patrickariasinsurance.com" },
            {
                name: "Patrick Arias Insurance",
                email: "patrick@patrickariasinsurance.com",
                address: {
                    street: "84421 Vermouth Dr",
                    city: "Coachella",
                    state: "CA",
                    zip: "92236",
                },
                phone: "",
                allowedStates: ["CA"],
            },
            { upsert: true, new: true }
        );
        console.log("✅ Agency created:", agency.name);

        // 2. Create Admin User
        const passwordHash = await hashPassword("Patrick@2026");

        const adminUser = await User.findOneAndUpdate(
            { email: "patrick@patrickariasinsurance.com" },
            {
                agencyId: agency._id,
                name: "Patrick Arias",
                email: "patrick@patrickariasinsurance.com",
                passwordHash,
                role: "agency_admin",
            },
            { upsert: true, new: true }
        );
        console.log("✅ Admin user created:", adminUser.email);

        console.log("\n✨ Patrick Arias Insurance seeded!\n");
        console.log("📝 Login Credentials:");
        console.log("   patrick@patrickariasinsurance.com / Patrick@2026");
        console.log("\n📋 Agency Details:");
        console.log("   Name    : Patrick Arias Insurance");
        console.log("   Address : 84421 Vermouth Dr, Coachella, CA 92236");
        console.log("\n✅ Done!");
    } catch (error) {
        console.error("❌ Error seeding Patrick Arias:", error);
        throw error;
    }
}

if (require.main === module) {
    seedPatrickArias()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export default seedPatrickArias;