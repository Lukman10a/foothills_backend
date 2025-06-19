import { Router } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByProvider
} from '../controllers/serviceController';
import { authenticate, requireProvider } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { serviceSchema, serviceUpdateSchema, serviceIdSchema, serviceQuerySchema } from '../validations/serviceValidation';

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

export default router; 