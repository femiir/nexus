import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * MongoDB Diagnostic Endpoint
 * Access at: https://nexus.femiir.dev/api/debug/mongo
 *
 * This endpoint checks:
 * - MongoDB connection status
 * - Database name
 * - Number of events in the database
 * - Sample event data
 */
export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();

    // Get connection state
    const connectionState = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get database info
    const dbName = mongoose.connection.db?.databaseName || 'Unknown';
    const mongoUri = process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') || 'Not set';

    // Count events
    const eventCount = await Event.countDocuments();

    // Get sample events
    const sampleEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title slug date location createdAt')
      .lean();

    // Get all collection names
    const collections = await mongoose.connection.db?.listCollections().toArray() || [];
    const collectionNames = collections.map(c => c.name);

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      connection: {
        state: stateMap[connectionState],
        stateCode: connectionState,
        database: dbName,
        mongoUri: mongoUri,
        host: mongoose.connection.host
      },
      data: {
        totalEvents: eventCount,
        collections: collectionNames,
        sampleEvents: sampleEvents.map(event => ({
          title: event.title,
          slug: event.slug,
          date: event.date,
          location: event.location,
          createdAt: event.createdAt
        }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error("MongoDB diagnostic error:", error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        mongoUri: process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') || 'Not set'
      },
      connection: {
        state: 'error',
        stateCode: mongoose.connection.readyState
      }
    }, { status: 500 });
  }
}
