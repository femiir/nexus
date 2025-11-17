import mongoose, { Document, Model, Schema } from "mongoose";

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: Date;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Event schema
const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, "Event overview is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Event image is required"],
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      required: [true, "Event time is required"],
    },
    mode: {
      type: String,
      required: [true, "Event mode is required"],
      trim: true,
    },
    audience: {
      type: String,
      required: [true, "Event audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Event agenda is required"],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "Agenda must contain at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Event organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Event tags are required"],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "Tags must contain at least one item",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Generate slug from title and normalize date/time
EventSchema.pre("save", async function (next) {
  if (this.isModified("title")) {
    const baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    
    let slug = baseSlug;
    let counter = 1;
    
    const Event = this.constructor as Model<IEvent>;
    while (await Event.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }

  if (this.isModified("date")) {
    try {
      const dateObj = this.date instanceof Date ? this.date : new Date(this.date);
      if (isNaN(dateObj.getTime())) {
        return next(new Error("Invalid date format"));
      }
      this.date = dateObj;
    } catch {
      return next(new Error("Invalid date format"));
    }
  }

  if (this.isModified("time")) {
    const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
    if (!timeRegex.test(this.time.trim())) {
      return next(new Error("Time must be in format HH:MM AM/PM (e.g., 09:00 AM)"));
    }
    this.time = this.time.trim().toUpperCase().replace(/\s+/g, " ");
  }

  next();
});

// ❌ REMOVED: EventSchema.index({ slug: 1 }); - Already covered by unique: true

// ✅ Optional: Add compound indexes if you query by multiple fields
// EventSchema.index({ date: 1, location: 1 }); // For date + location queries
// EventSchema.index({ tags: 1 }); // For tag-based filtering

// Export the Event model
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
