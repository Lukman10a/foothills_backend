import { Router } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByProvider,
  blockDates,
  unblockDates,
  getAvailableCalendar,
  checkAvailability,
  uploadPropertyImages,
  deletePropertyImage,
  getPropertyImages,
  reorderPropertyImages,
  setPrimaryImage
} from '../controllers/serviceController';
import { authenticate, requireProvider } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { 
  serviceSchema, 
  serviceUpdateSchema, 
  serviceIdSchema, 
  serviceQuerySchema,
  blockDatesSchema,
  unblockDatesSchema,
  calendarQuerySchema,
  availabilityQuerySchema,
  reorderImagesSchema,
  setPrimaryImageSchema
} from '../validations/serviceValidation';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

/**
 * @route   GET /api/services
 * @desc    Get all services with optional filtering
 * @access  Public
 */
router.get('/', validateQuery(serviceQuerySchema), getAllServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id', validateParams(serviceIdSchema), getServiceById);

/**
 * @route   GET /api/services/provider/:providerId
 * @desc    Get services by provider
 * @access  Public
 */
router.get('/provider/:providerId', validateParams(serviceIdSchema), getServicesByProvider);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Provider/Admin only)
 */
router.post('/', authenticate, requireProvider, validateRequest(serviceSchema), createService);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Service owner or Admin only)
 */
router.put('/:id', authenticate, validateParams(serviceIdSchema), validateRequest(serviceUpdateSchema), updateService);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service
 * @access  Private (Service owner or Admin only)
 */
router.delete('/:id', authenticate, validateParams(serviceIdSchema), deleteService);

/**
 * @route   POST /api/services/:id/block-dates
 * @desc    Block dates for a service/property
 * @access  Private (Service owner or Admin only)
 */
router.post('/:id/block-dates', authenticate, validateParams(serviceIdSchema), validateRequest(blockDatesSchema), blockDates);

/**
 * @route   POST /api/services/:id/unblock-dates
 * @desc    Unblock dates for a service/property
 * @access  Private (Service owner or Admin only)
 */
router.post('/:id/unblock-dates', authenticate, validateParams(serviceIdSchema), validateRequest(unblockDatesSchema), unblockDates);

/**
 * @route   GET /api/services/:id/calendar
 * @desc    Get calendar view for a service/property
 * @access  Public
 */
router.get('/:id/calendar', validateParams(serviceIdSchema), validateQuery(calendarQuerySchema), getAvailableCalendar);

/**
 * @route   GET /api/services/:id/availability
 * @desc    Check availability for specific date range
 * @access  Public
 */
router.get('/:id/availability', validateParams(serviceIdSchema), validateQuery(availabilityQuerySchema), checkAvailability);

/**
 * @route   POST /api/services/:id/images
 * @desc    Upload images for a property
 * @access  Private (Service owner or Admin only)
 */
router.post('/:id/images', authenticate, validateParams(serviceIdSchema), uploadMultiple, uploadPropertyImages);

/**
 * @route   DELETE /api/services/:id/images/:imageId
 * @desc    Delete a specific image from a property
 * @access  Private (Service owner or Admin only)
 */
router.delete('/:id/images/:imageId', authenticate, validateParams(serviceIdSchema), deletePropertyImage);

/**
 * @route   GET /api/services/:id/images
 * @desc    Get all images for a property
 * @access  Public
 */
router.get('/:id/images', validateParams(serviceIdSchema), getPropertyImages);

/**
 * @route   PUT /api/services/:id/images/reorder
 * @desc    Reorder property images
 * @access  Private (Service owner or Admin only)
 */
router.put('/:id/images/reorder', authenticate, validateParams(serviceIdSchema), validateRequest(reorderImagesSchema), reorderPropertyImages);

/**
 * @route   PUT /api/services/:id/images/primary
 * @desc    Set primary image for a property
 * @access  Private (Service owner or Admin only)
 */
router.put('/:id/images/primary', authenticate, validateParams(serviceIdSchema), validateRequest(setPrimaryImageSchema), setPrimaryImage);

export default router; 