const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://kapilmsharma214_db_user:36KVNiu1BlpCMNZB@cluster0.yjizl3q.mongodb.net/test?appName=Cluster0").then(async () => {
  const db = mongoose.connection.db;
  const doc = await db.collection("submissions").findOne({ _id: new mongoose.Types.ObjectId("69c5648ba0bd9df2367b22c2") });
  console.log(JSON.stringify(doc.clientContact, null, 2));
  console.log(doc.payload.companyName);
  console.log(doc.payload.namedInsured);
  console.log(doc.payload.insuredName);
  console.log(doc.clientName);
  process.exit(0);
});
