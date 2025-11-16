import mongoose, { Document, Model, Schema } from "mongoose";

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Booking schema
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          // RFC 5322 compliant email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook: Verify that the referenced Event exists
BookingSchema.pre("save", async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isNew || this.isModified("eventId")) {
    try {
      const Event = mongoose.model("Event");
      const eventExists = await Event.findById(this.eventId);

      if (!eventExists) {
        return next(new Error(`Event with ID ${this.eventId} does not exist`));
      }
    } catch {
      return next(new Error("Error validating event reference"));
    }
  }

  next();
});

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Create compound index for preventing duplicate bookings
BookingSchema.index({ eventId: 1, email: 1 });

// Export the Booking model
const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
