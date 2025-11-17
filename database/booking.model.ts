import mongoose, { Document, Model, Schema } from "mongoose";

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Extract regex to module-level constant
// RFC 5322 compliant email validation pattern
const EMAIL_VALIDATION_REGEX = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

// ✅ Extract validator function for reusability
export function isValidEmail(email: string): boolean {
  return EMAIL_VALIDATION_REGEX.test(email);
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
        validator: isValidEmail, // ✅ Clean and reusable
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Create compound index for preventing duplicate bookings
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Export the Booking model
const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
