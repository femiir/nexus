import mongoose from "mongoose";

// Define the structure for cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global namespace to include our mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Get MongoDB URI from environment variables
// NOTE: Don't validate here - validation happens at runtime in connectDB()
// This allows the module to be imported during build without requiring env vars
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cached connection object
// In development, use a global variable to preserve the connection across hot reloads
// In production, the connection is created fresh on each deployment
const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes a connection to MongoDB using Mongoose
 * Uses connection caching to prevent multiple connections in serverless environments
 * 
 * @returns {Promise<typeof mongoose>} The mongoose instance with active connection
 */
async function connectDB(): Promise<typeof mongoose> {
  // Validate MongoDB URI at runtime (not at module import time)
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering to fail fast in serverless
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log("✅ MongoDB connected successfully");
      return mongooseInstance;
    });
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the promise on error so next call will retry
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
