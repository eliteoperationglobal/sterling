import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../lib/mongodb";
import Submission from "../models/Submission";
import Quote from "../models/Quote";
import Agency from "../models/Agency";

dotenv.config({ path: ".env.local" });

async function seed() {
    await connectDB();
    console.log("Connected to DB");

    const agency = await Agency.findOne({ email: "admin@capcoinsurance.com" }) || await Agency.findOne();
    if (!agency) {
        console.log("No agency found");
        process.exit(1);
    }

    // Create submission
    const submission = new Submission({
        submissionNumber: Math.floor(Math.random() * 1000000),
        agencyId: agency._id,
        payload: {
            companyName: "Test Multi-Policy Corp",
            firstName: "Test",
            lastName: "User",
            addExcessLiability: true,
            excessLiabilityAmount: 2000000
        },
        clientContact: {
            name: "Test User",
            phone: "123-456-7890",
            email: "test@example.com",
            businessAddress: { street: "123 Test St", city: "Testville", state: "FL", zip: "12345" }
        },
        status: "QUOTED",
        state: "FL",
        esignCompleted: true,
        paymentStatus: "PAID",
        paymentDate: new Date(),
        bindRequested: false,
        bindApproved: false,
        bindStatus: "NOT_REQUESTED"
    });
    await submission.save();

    // Create GL Quote
    const glQuote = new Quote({
        submissionId: submission._id,
        carrierId: new mongoose.Types.ObjectId(), // dummy carrier
        policyType: "GENERAL_LIABILITY",
        carrierQuoteUSD: 1000,
        brokerFeeAmountUSD: 100,
        finalAmountUSD: 1100,
        status: "APPROVED"
    });
    await glQuote.save();

    // Create XL Quote
    const xlQuote = new Quote({
        submissionId: submission._id,
        carrierId: new mongoose.Types.ObjectId(), // dummy carrier
        policyType: "EXCESS_LIABILITY",
        carrierQuoteUSD: 500,
        brokerFeeAmountUSD: 50,
        finalAmountUSD: 550,
        status: "APPROVED"
    });
    await xlQuote.save();

    console.log(`Successfully seeded submission: ${submission._id}`);
    process.exit(0);
}
seed().catch(console.error);
