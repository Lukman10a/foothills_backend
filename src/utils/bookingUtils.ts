import { Types } from 'mongoose';
import Booking from '../models/Booking';
import { AppError } from '../middleware/errorHandler';

/**
 * Check if a time slot is available for booking
 * @param serviceId - Service ID
 * @param date - Booking date
 * @param duration - Duration in minutes (default: 60)
 * @param excludeBookingId - Booking ID to exclude from check (for updates)
 * @returns Promise<boolean> - True if available, false if conflicting
 */
export const checkAvailability = async (
  serviceId: string | Types.ObjectId,
  date: Date,
  duration: number = 60,
  excludeBookingId?: string | Types.ObjectId
): Promise<boolean> => {
  const startTime = new Date(date.getTime() - (duration / 2) * 60 * 1000); // 30 minutes before
  const endTime = new Date(date.getTime() + (duration / 2) * 60 * 1000);   // 30 minutes after

  const filter: any = {
    service: serviceId,
    date: {
      $gte: startTime,
      $lte: endTime
    },
    status: { $in: ['pending', 'confirmed'] }
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(filter);
  return !conflictingBooking;
};

/**
 * Validate booking request
 * @param serviceId - Service ID
 * @param date - Booking date
 * @param userId - User ID
 * @param duration - Duration in minutes
 * @returns Promise<void> - Throws error if validation fails
 */
export const validateBookingRequest = async (
  serviceId: string | Types.ObjectId,
  date: Date,
  userId: string | Types.ObjectId,
  duration: number = 60
): Promise<void> => {
  // Check if booking date is in the future
  const now = new Date();
  if (date <= now) {
    throw new AppError('Booking date must be in the future', 400);
  }

  // Check if user already has a booking for this service on the same day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBooking = await Booking.findOne({
    user: userId,
    service: serviceId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'confirmed'] }
  });

  if (existingBooking) {
    throw new AppError('You already have a booking for this service on this date', 400);
  }

  // Check availability
  const isAvailable = await checkAvailability(serviceId, date, duration);
  if (!isAvailable) {
    throw new AppError('This time slot is not available', 400);
  }
};

/**
 * Get available time slots for a service on a specific date
 * @param serviceId - Service ID
 * @param date - Date to check
 * @param businessHours - Business hours object
 * @returns Promise<Array<Date>> - Array of available time slots
 */
export const getAvailableTimeSlots = async (
  serviceId: string | Types.ObjectId,
  date: Date,
  businessHours: { start: number; end: number } = { start: 9, end: 17 }
): Promise<Date[]> => {
  const availableSlots: Date[] = [];
  const startOfDay = new Date(date);
  startOfDay.setHours(businessHours.start, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(businessHours.end, 0, 0, 0);

  // Generate time slots every hour
  for (let time = new Date(startOfDay); time < endOfDay; time.setHours(time.getHours() + 1)) {
    const slotTime = new Date(time);
    const isAvailable = await checkAvailability(serviceId, slotTime);
    
    if (isAvailable) {
      availableSlots.push(new Date(slotTime));
    }
  }

  return availableSlots;
};

/**
 * Update booking status with validation
 * @param bookingId - Booking ID
 * @param newStatus - New status
 * @param userId - User ID (for authorization)
 * @param userRole - User role
 * @returns Promise<void> - Throws error if update is not allowed
 */
export const updateBookingStatus = async (
  bookingId: string | Types.ObjectId,
  newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  userId: string | Types.ObjectId,
  userRole: string
): Promise<void> => {
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check authorization
  const canUpdate = userRole === 'admin' || 
                   booking.user.toString() === userId.toString() ||
                   (userRole === 'provider' && booking.service.toString() === userId.toString());

  if (!canUpdate) {
    throw new AppError('Not authorized to update this booking', 403);
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'cancelled': [],
    'completed': []
  };

  const allowedTransitions = validTransitions[booking.status];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new AppError(`Cannot change status from ${booking.status} to ${newStatus}`, 400);
  }

  // Additional business rules
  if (newStatus === 'completed' && booking.date > new Date()) {
    throw new AppError('Cannot complete a booking that has not occurred yet', 400);
  }

  if (newStatus === 'cancelled' && booking.status === 'completed') {
    throw new AppError('Cannot cancel a completed booking', 400);
  }
};

/**
 * Get booking statistics for a service
 * @param serviceId - Service ID
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Promise<Object> - Booking statistics
 */
export const getBookingStatistics = async (
  serviceId: string | Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}> => {
  const stats = await Booking.aggregate([
    {
      $match: {
        service: new Types.ObjectId(serviceId.toString()),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0
  };

  stats.forEach(stat => {
    result[stat._id as keyof typeof result] = stat.count;
    result.total += stat.count;
  });

  return result;
}; 