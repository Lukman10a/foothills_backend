import { Router } from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  createInventoryBooking,
  updateBooking,
  cancelBooking,
  getBookingsByUser
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { 
  bookingSchema, 
  bookingWithInventorySchema,
  bookingUpdateSchema, 
  bookingIdSchema, 
  bookingQuerySchema 
} from '../validations/bookingValidation';

const router = Router();

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with optional filtering
 * @access  Private
 */
router.get('/', authenticate, validateQuery(bookingQuerySchema), getAllBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, validateParams(bookingIdSchema), getBookingById);

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get bookings by user
 * @access  Private
 */
router.get('/user/:userId', authenticate, validateParams(bookingIdSchema), validateQuery(bookingQuerySchema), getBookingsByUser);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking (legacy - single date)
 * @access  Private
 */
router.post('/', authenticate, validateRequest(bookingSchema), createBooking);

/**
 * @route   POST /api/bookings/inventory
 * @desc    Create new booking with inventory support (date range)
 * @access  Private
 */
router.post('/inventory', authenticate, validateRequest(bookingWithInventorySchema), createInventoryBooking);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.put('/:id', authenticate, validateParams(bookingIdSchema), validateRequest(bookingUpdateSchema), updateBooking);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */
router.delete('/:id', authenticate, validateParams(bookingIdSchema), cancelBooking);

export default router; 