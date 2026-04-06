const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://kapilmsharma214_db_user:36KVNiu1BlpCMNZB@cluster0.yjizl3q.mongodb.net/test?appName=Cluster0").then(async () => {
  const db = mongoose.connection.db;
  const doc = await db.collection("submissions").findOne({ _id: new mongoose.Types.ObjectId("69c5648ba0bd9df2367b22c2") });
  console.log("contactPerson:", doc.payload.contactPerson);
  console.log("contactName:", doc.payload.contactName);
  console.log("firstName:", doc.payload.firstName);
  process.exit(0);
});
