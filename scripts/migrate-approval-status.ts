import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please define the MONGODB_URI environment variable inside .env.local");
    process.exit(1);
}

async function run() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        // We do direct collection update to avoid Mongoose validation if needed,
        // though our setter might handle it. Direct update is safer for bulk logic change.
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("No database connection");
        }

        const collection = db.collection("submissions");

        const result = await collection.updateMany(
            { status: "APPROVAL_REQUESTED" },
            { $set: { status: "SUBMITTED" } }
        );

        console.log(`Matched ${result.matchedCount} documents`);
        console.log(`Modified ${result.modifiedCount} documents`);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (err) {
        console.error("Error updating applications:", err);
        process.exit(1);
    }
}

run();
