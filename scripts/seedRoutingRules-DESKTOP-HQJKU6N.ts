// Load .env.local file FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import modules that need environment variables
import connectDB from "../src/lib/mongodb";
import RoutingRule from "../src/models/RoutingRule";
import Carrier from "../src/models/Carrier";

async function seedRoutingRules() {
  try {
    console.log("🌱 Starting routing rules seed...");

    await connectDB();

    // Get carriers
    const carriers = await Carrier.find({});
    if (carriers.length === 0) {
      console.log("⚠️  No carriers found. Please seed carriers first.");
      return;
    }

    console.log(`📦 Found ${carriers.length} carriers`);

    // Clear existing rules
    await RoutingRule.deleteMany({});
    console.log("🗑️  Cleared existing routing rules");

    // Create routing rules
    const rules = [];

    // Find carriers by name (assuming they exist from seedAll)
    const pacificCarrier = carriers.find((c) =>
      c.name.toLowerCase().includes("pacific")
    );
    const goldenCarrier = carriers.find((c) =>
      c.name.toLowerCase().includes("golden")
    );

    // Restaurant rules
    if (pacificCarrier) {
      rules.push({
        industry: "Hospitality",
        subtype: "Restaurant",
        state: "CA",
        carrierId: pacificCarrier._id,
        priority: 10, // High priority
        isActive: true,
      });
    }

    if (goldenCarrier) {
      rules.push({
        industry: "Hospitality",
        subtype: "Restaurant",
        state: null, // All states
        carrierId: goldenCarrier._id,
        priority: 20,
        isActive: true,
      });
    }

    // Contractor rules
    if (pacificCarrier) {
      rules.push({
        industry: "Construction",
        subtype: "Contractor",
        state: "CA",
        carrierId: pacificCarrier._id,
        priority: 10,
        isActive: true,
      });
    }

    if (goldenCarrier) {
      rules.push({
        industry: "Construction",
        subtype: "Contractor",
        state: null,
        carrierId: goldenCarrier._id,
        priority: 20,
        isActive: true,
      });
    }

    // Trucking rules
    if (pacificCarrier) {
      rules.push({
        industry: "Transportation",
        subtype: "Trucking",
        state: "CA",
        carrierId: pacificCarrier._id,
        priority: 10,
        isActive: true,
      });
    }

    if (goldenCarrier) {
      rules.push({
        industry: "Transportation",
        subtype: "Trucking",
        state: null,
        carrierId: goldenCarrier._id,
        priority: 20,
        isActive: true,
      });
    }

    // Insert rules
    if (rules.length > 0) {
      await RoutingRule.insertMany(rules);
      console.log(`✅ Created ${rules.length} routing rules`);
    } else {
      console.log("⚠️  No routing rules created. Check if carriers exist.");
    }

    // Display summary
    const allRules = await RoutingRule.find({}).populate("carrierId", "name");
    console.log("\n📋 Routing Rules Summary:");
    allRules.forEach((rule: any) => {
      console.log(
        `  - ${rule.industry} / ${rule.subtype} / ${rule.state || "All States"} → ${rule.carrierId?.name || "Unknown"} (Priority: ${rule.priority})`
      );
    });

    console.log("\n✨ Routing rules seeding completed!");
  } catch (error: any) {
    console.error("❌ Error seeding routing rules:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRoutingRules()
    .then(() => {
      console.log("✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export default seedRoutingRules;




