import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import Service from '../models/Service';
import Category from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { 
  buildSearchQuery, 
  buildFilterQuery, 
  buildSortQuery, 
  buildPaginationOptions, 
  createPaginatedResponse,
  sanitizeSearchInput 
} from '../utils/searchUtils';

/**
 * Get all services with advanced search, filtering, and sorting
 * GET /api/services
 */
export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
  const { 
    search, 
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build search query
  const searchFields = ['name', 'description'];
  const searchQuery = search ? buildSearchQuery(sanitizeSearchInput(search as string), searchFields) : {};

  // Build filter query
  const allowedFilters = ['category', 'provider', 'price'];
  const filterQuery = buildFilterQuery(req.query, allowedFilters);

  // Combine search and filter queries
  const combinedFilter = { ...searchQuery, ...filterQuery };

  // Build sort query
  const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
  const sortQuery = buildSortQuery(
    { sort: `${order === 'desc' ? '-' : ''}${sort}` },
    { createdAt: -1 },
    allowedSortFields
  );

  // Build pagination options
  const { page: pageNum, limit: limitNum, skip } = buildPaginationOptions(req.query, 10, 100);

  // Execute query with aggregation for better performance
  const pipeline = [
    { $match: combinedFilter },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'provider',
        foreignField: '_id',
        as: 'provider'
      }
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$provider',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        price: 1,
        duration: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        'category._id': 1,
        'category.name': 1,
        'category.description': 1,
        'provider._id': 1,
        'provider.firstName': 1,
        'provider.lastName': 1,
        'provider.email': 1
      }
    },
    { $sort: sortQuery },
    { $skip: skip },
    { $limit: limitNum }
  ];

  // Execute aggregation
  const services = await Service.aggregate(pipeline);
  const total = await Service.countDocuments(combinedFilter);

  // Create paginated response
  const paginatedResponse = createPaginatedResponse(services, total, pageNum, limitNum);

  res.status(200).json(successResponse(paginatedResponse, 'Services retrieved successfully'));
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