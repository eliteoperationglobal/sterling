const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Submission = mongoose.model("Submission", new mongoose.Schema({ companyName: String }, { strict: false }));
  const Quote = mongoose.model("Quote", new mongoose.Schema({ submissionId: mongoose.Schema.Types.ObjectId, status: String, policyType: String }, { strict: false }));

  const sub = await Submission.findOne({ $or: [{"payload.companyName": "TestFixCompany"}, {"clientContact.name": "TestFixCompany"}] });
  if (!sub) {
    console.log("Not found");
    process.exit(1);
  }
  console.log("Sub:", sub._id, "bindApproved:", sub.get("bindApproved"));
  const quotes = await Quote.find({ submissionId: sub._id });
  for (const q of quotes) {
    console.log("Quote:", q._id, q.get("policyType"), q.get("status"));
  }
  process.exit(0);
}
run();
