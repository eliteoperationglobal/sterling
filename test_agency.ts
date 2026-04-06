import mongoose from 'mongoose';
import connectDB from './src/lib/mongodb';
import Agency from './src/models/Agency';

async function main() {
    await connectDB();
    const agencies = await Agency.find({ name: /gamaty|capital/i });
    console.log("Found agencies:", agencies.length);
    for (const a of agencies) {
        console.log("ID:", a._id.toString());
        console.log("Name:", JSON.stringify(a.name));
        console.log("Includes 'Capital & Co':", a.name.includes("Capital & Co"));
    }
    process.exit(0);
}
main();
