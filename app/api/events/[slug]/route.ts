import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/events/[slug]
 * Fetches a single event by its unique slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params to extract slug (Next.js 15+ requirement)
    const { slug } = await params;

    // Validate slug parameter
    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        { message: "Event slug is required and must be a valid string" },
        { status: 400 }
      );
    }

    // Sanitize slug (remove any potential injection characters)
    const sanitizedSlug = slug.trim().toLowerCase();

    // Connect to database
    await connectDB();

    // Query event by slug
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug "${sanitizedSlug}" not found` },
        { status: 404 }
      );
    }

    // Return event data
    return NextResponse.json(
      {
        message: "Event fetched successfully",
        event,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching event by slug:", e);

    // Handle mongoose validation errors
    if (e instanceof Error && e.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid slug format" },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
