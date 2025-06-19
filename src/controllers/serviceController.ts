import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import Service from '../models/Service';
import Category from '../models/Category';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all services with optional filtering
 * GET /api/services
 */
export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
  const { category, provider, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  
  if (category) {
    filter.category = category;
  }
  
  if (provider) {
    filter.provider = provider;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const services = await Service.find(filter)
    .populate('category', 'name')
    .populate('provider', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await Service.countDocuments(filter);
  
  const response = {
    services,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
  
  res.status(200).json(successResponse(response, 'Services retrieved successfully'));
});

/**
 * Get single service by ID
 * GET /api/services/:id
 */
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const service = await Service.findById(req.params['id'])
    .populate('category', 'name description')
    .populate('provider', 'firstName lastName email');
  
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  
  res.status(200).json(successResponse(service, 'Service retrieved successfully'));
});

/**
 * Create new service
 * POST /api/services
 */
export const createService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, category, price } = req.body;
  
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new AppError('Category not found', 404);
  }
  
  const service = await Service.create({
    name,
    description,
    category,
    price,
    provider: req.user._id
  });
  
  const populatedService = await Service.findById(service._id)
    .populate('category', 'name')
    .populate('provider', 'firstName lastName email');
  
  res.status(201).json(createdResponse(populatedService, 'Service created successfully'));
});

/**
 * Update service
 * PUT /api/services/:id
 */
export const updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, category, price } = req.body;
  
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  // Check if service exists
  const service = await Service.findById(req.params['id']);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  
  // Check if user owns the service or is admin
  if (service.provider.toString() !== (req.user._id ? req.user._id.toString() : '') && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this service', 403);
  }
  
  // Verify category exists if provided
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Update service
  const updatedService = await Service.findByIdAndUpdate(
    req.params['id'],
    { name, description, category, price },
    { new: true, runValidators: true }
  ).populate('category', 'name')
   .populate('provider', 'firstName lastName email');
  
  res.status(200).json(successResponse(updatedService, 'Service updated successfully'));
});

/**
 * Delete service
 * DELETE /api/services/:id
 */
export const deleteService = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  const service = await Service.findById(req.params['id']);
  
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  
  // Check if user owns the service or is admin
  if (service.provider.toString() !== (req.user._id ? req.user._id.toString() : '') && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this service', 403);
  }
  
  // TODO: Check if service has any bookings before deletion
  // const bookingsForService = await Booking.find({ service: req.params['id'] });
  // if (bookingsForService.length > 0) {
  //   throw new AppError('Cannot delete service that has bookings', 400);
  // }
  
  await Service.findByIdAndDelete(req.params['id']);
  
  res.status(200).json(successResponse(null, 'Service deleted successfully'));
});

/**
 * Get services by provider
 * GET /api/services/provider/:providerId
 */
export const getServicesByProvider = asyncHandler(async (req: Request, res: Response) => {
  const services = await Service.find({ provider: req.params['providerId'] })
    .populate('category', 'name')
    .populate('provider', 'firstName lastName email')
    .sort({ createdAt: -1 });
  
  res.status(200).json(successResponse(services, 'Provider services retrieved successfully'));
}); 