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
  process.exit(1);
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

console.log("✅ .env.local loaded");
console.log("🔑 MONGODB_URI exists:", !!process.env.MONGODB_URI);

/**
 * Migration script to update broker agency name
 * Updates "California Insurance Agency" to "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services"
 */
async function updateAgencyName() {
  try {
    // Dynamically import after environment is loaded
    const { default: connectDB } = await import("../src/lib/mongodb");
    const Agency = (await import("../src/models/Agency")).default;
    
    await connectDB();
    console.log("🔄 Starting agency name update...");

    const newAgencyName = "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services";

    // Update agency1 (California Insurance Agency)
    const agency1 = await Agency.findOneAndUpdate(
      { email: "agency1@example.com" },
      { name: newAgencyName },
      { new: true }
    );

    if (agency1) {
      console.log(`✅ Updated agency1 (${agency1.email}):`);
      console.log(`   Old name: "California Insurance Agency"`);
      console.log(`   New name: "${agency1.name}"`);
    } else {
      console.log("⚠️  Agency1 not found (email: agency1@example.com)");
    }

    // Also update any other agencies with the old name
    const updatedAgencies = await Agency.updateMany(
      { name: "California Insurance Agency" },
      { $set: { name: newAgencyName } }
    );

    if (updatedAgencies.modifiedCount > 0) {
      console.log(`✅ Updated ${updatedAgencies.modifiedCount} additional agency/agencies with old name`);
    }

    console.log("✨ Agency name update completed!");
  } catch (error) {
    console.error("❌ Error updating agency name:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateAgencyName()
    .then(() => {
      console.log("✅ Update completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Update failed:", error);
      process.exit(1);
    });
}

export default updateAgencyName;

