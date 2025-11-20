/**
 * Health Check Endpoint
 *
 * Used by Docker health checks to verify the application is running
 * Similar to Django's health check endpoints
 */

import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  let mongoStatus = 'unknown';

  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    mongoStatus = state === 1 ? 'connected' : 'disconnected';
  } catch {
    mongoStatus = 'error';
  }

  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nexus',
      mongodb: mongoStatus
    },
    { status: 200 }
  )
}
