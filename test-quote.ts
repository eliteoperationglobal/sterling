import mongoose from 'mongoose';
import Quote from './src/models/Quote';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://developer:Sterl1ng!@cluster0.k2dfi.mongodb.net/sterlingportal?retryWrites=true&w=majority&appName=Cluster0');
  const quote = await Quote.findOne({ 'limits.generalLiability': { $exists: true } }).sort({ createdAt: -1 });
  console.log(JSON.stringify(quote?.limits || {}, null, 2));
  mongoose.disconnect();
}
run();
