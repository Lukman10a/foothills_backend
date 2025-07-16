import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IBooking extends Document {
  user: Types.ObjectId;
  service: Types.ObjectId;
  date: Date;
  endDate?: Date; // For inventory bookings with date ranges
  units?: number; // Number of units booked (for inventory support)
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  endDate: {
    type: Date,
    required: false
  },
  units: {
    type: Number,
    min: [1, 'At least 1 unit required'],
    max: [100, 'Maximum 100 units allowed'],
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

bookingSchema.index({ user: 1 });
bookingSchema.index({ service: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ endDate: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking; 