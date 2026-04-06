// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Then run the seed script with tsx
require('tsx/cjs');
const seedAll = require('./seedAll.ts').default;

seedAll()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
