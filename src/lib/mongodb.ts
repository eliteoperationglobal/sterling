import mongoose from "mongoose";

// Import all models to ensure they are registered
import "@/models/ActivityLog";
import "@/models/Agency";
import "@/models/BoundPolicy";
import "@/models/CancelRequest";
import "@/models/Carrier";
import "@/models/Counter";
import "@/models/Draft";
import "@/models/FinancePlan";
import "@/models/FormTemplate";
import "@/models/Industry";
import "@/models/Payment";
import "@/models/Policy";
import "@/models/Quote";
import "@/models/RoutingLog";
import "@/models/RoutingRule";
import "@/models/Submission";
import "@/models/ToolRequest";
import "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;














