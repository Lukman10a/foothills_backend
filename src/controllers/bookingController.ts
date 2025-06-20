import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseFormatter';
import Booking from '../models/Booking';
import { AppError } from '../middleware/errorHandler';
import { validateBookingRequest, updateBookingStatus as updateBookingStatusUtil } from '../utils/bookingUtils';

/**
 * Get all bookings with optional filtering
 * GET /api/bookings
 */
export const getAllBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user, service, status, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  
  // If user is not admin, only show their bookings
  if (req.user && req.user.role !== 'admin') {
    filter.user = req.user._id;
  } else if (user) {
    filter.user = user;
  }
  
  if (service) {
    filter.service = service;
  }
  
  if (status) {
    filter.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const bookings = await Booking.find(filter)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .populate({
      path: 'service',
      populate: {
        path: 'provider',
        select: 'firstName lastName email'
      }
    })
    .sort({ date: 1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await Booking.countDocuments(filter);
  
  const response = {
    bookings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
  
  res.status(200).json(successResponse(response, 'Bookings retrieved successfully'));
});

/**
 * Get single booking by ID
 * GET /api/bookings/:id
 */
export const getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params['id'])
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'service',
      populate: [
        { path: 'category', select: 'name description' },
        { path: 'provider', select: 'firstName lastName email' }
      ]
    });
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  
  // Check if user can access this booking
  if (req.user && req.user.role !== 'admin' && (!req.user._id || booking.user.toString() !== req.user._id.toString())) {
    throw new AppError('Not authorized to access this booking', 403);
  }
  
  res.status(200).json(successResponse(booking, 'Booking retrieved successfully'));
});

/**
 * Create new booking
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serviceId, date, notes } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Validate booking request using business logic
  await validateBookingRequest(serviceId, new Date(date), userId.toString());

  const booking = await Booking.create({
    user: userId,
    service: serviceId,
    date: new Date(date),
    notes,
    status: 'pending'
  });

  await booking.populate(['user', 'service']);

  res.status(201).json(successResponse(booking, 'Booking created successfully'));
});

/**
 * Update booking status
 * PUT /api/bookings/:id
 */
export const updateBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, notes, status } = req.body;
  const bookingId = req.params['id'];
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const booking = await Booking.findById(bookingId)
    .populate(['user', 'service']);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Check authorization
  if (req.user && req.user.role !== 'admin' && req.user._id && booking.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this booking', 403);
  }

  // If status is being updated, validate the transition
  if (status && status !== booking.status && userId) {
    const role = userRole || 'customer';
    // @ts-ignore - userId is verified to exist above
    await updateBookingStatusUtil(bookingId, status, userId, role);
  }

  // If date is being updated, validate availability
  if (date && new Date(date).getTime() !== booking.date.getTime()) {
    await validateBookingRequest(booking.service, new Date(date), booking.user.toString(), 60);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
      ...(status && { status })
    },
    { new: true, runValidators: true }
  ).populate(['user', 'service']);

  res.json(successResponse(updatedBooking, 'Booking updated successfully'));
});

/**
 * Cancel booking
 * DELETE /api/bookings/:id
 */
export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  const booking = await Booking.findById(req.params['id']);
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  
  // Check if user can cancel this booking
  const canCancel = req.user.role === 'admin' || 
                   (!!req.user._id && booking.user.toString() === req.user._id.toString()) ||
                   (req.user.role === 'provider' && !!req.user._id && booking.service.toString() === req.user._id.toString());
  
  if (!canCancel) {
    throw new AppError('Not authorized to cancel this booking', 403);
  }
  
  // Check if booking can be cancelled
  if (booking.status === 'completed') {
    throw new AppError('Cannot cancel completed booking', 400);
  }
  
  // Update booking status to cancelled
  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params['id'],
    { status: 'cancelled' },
    { new: true }
  ).populate('user', 'firstName lastName email')
   .populate({
     path: 'service',
     populate: [
       { path: 'category', select: 'name' },
       { path: 'provider', select: 'firstName lastName email' }
     ]
   });
  
  res.status(200).json(successResponse(updatedBooking, 'Booking cancelled successfully'));
});

/**
 * Get bookings by user
 * GET /api/bookings/user/:userId
 */
export const getBookingsByUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const filter: any = { user: req.params['userId'] };
  
  if (status) {
    filter.status = status;
  }
  
  // Check if user can access these bookings
  if (req.user && req.user.role !== 'admin' && req.params['userId'] !== (req.user._id ? req.user._id.toString() : '')) {
    throw new AppError('Not authorized to access these bookings', 403);
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const bookings = await Booking.find(filter)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'service',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'provider', select: 'firstName lastName email' }
      ]
    })
    .sort({ date: 1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await Booking.countDocuments(filter);
  
  const response = {
    bookings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
  
  res.status(200).json(successResponse(response, 'User bookings retrieved successfully'));
});

export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const bookingId = req.params['id'];
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Validate status transition using business logic
  if (userId) {
    const role = userRole || 'customer';
    // @ts-ignore - userId is verified to exist above
    await updateBookingStatusUtil(bookingId, status, userId, role);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status },
    { new: true, runValidators: true }
  ).populate(['user', 'service']);

  res.json(successResponse(updatedBooking, 'Booking status updated successfully'));
}); 