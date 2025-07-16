import { Request, Response } from 'express';
import Service from '../models/Service';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import { Types } from 'mongoose';
import { IUser, AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { 
  buildSearchQuery, 
  buildSortQuery, 
  buildPaginationOptions, 
  createPaginatedResponse,
  sanitizeSearchInput 
} from '../utils/searchUtils';
import Category from '../models/Category';
import path from 'path';
import { 
  processImage, 
  deleteImageFile, 
  generateImageUrl, 
  extractFilenameFromUrl 
} from '../middleware/upload';

/**
 * Get all services with advanced search, filtering, and sorting
 * GET /api/services
 */
export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
  const { 
    search, 
    sort = 'createdAt',
    order = 'desc',
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    maxGuests,
    city,
    isActive
  } = req.query;

  // Build search query
  const searchFields = ['name', 'description', 'address.city', 'address.state'];
  const searchQuery = search ? buildSearchQuery(sanitizeSearchInput(search as string), searchFields) : {};

  // Build filter query with enhanced property filters
  const filterQuery: any = {};
  
  // Standard filters
  if (req.query['category']) filterQuery.category = new Types.ObjectId(req.query['category'] as string);
  if (req.query['provider']) filterQuery.provider = new Types.ObjectId(req.query['provider'] as string);
  
  // Enhanced property filters
  if (propertyType) filterQuery.propertyType = propertyType;
  if (bedrooms) filterQuery.bedrooms = { $gte: Number(bedrooms) };
  if (bathrooms) filterQuery.bathrooms = { $gte: Number(bathrooms) };
  if (maxGuests) filterQuery.maxGuests = { $gte: Number(maxGuests) };
  if (city) filterQuery['address.city'] = new RegExp(city as string, 'i');
  if (isActive !== undefined) filterQuery.isActive = isActive === 'true';
  
  // Price range filters
  if (minPrice || maxPrice) {
    filterQuery.price = {};
    if (minPrice) filterQuery.price.$gte = Number(minPrice);
    if (maxPrice) filterQuery.price.$lte = Number(maxPrice);
  }

  // Combine search and filter queries
  const combinedFilter = { ...searchQuery, ...filterQuery };

  // Build sort query
  const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'bedrooms', 'bathrooms', 'maxGuests'];
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
        propertyType: 1,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 1,
        amenities: 1,
        images: 1,
        address: 1,
        unavailableDates: 1,
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

  res.status(200).json(successResponse(paginatedResponse, 'Properties retrieved successfully'));
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
 * Create new service/property
 * POST /api/services
 */
export const createService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    name, 
    description, 
    category, 
    price,
    propertyType,
    bedrooms,
    bathrooms,
    maxGuests,
    amenities,
    images,
    address,
    unavailableDates,
    isActive
  } = req.body;
  
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
    provider: req.user._id,
    propertyType,
    bedrooms,
    bathrooms,
    maxGuests,
    amenities,
    images,
    address,
    unavailableDates,
    isActive
  });
  
  const populatedService = await Service.findById(service._id)
    .populate('category', 'name description')
    .populate('provider', 'firstName lastName email');
  
  res.status(201).json(createdResponse(populatedService, 'Property created successfully'));
});

/**
 * Update service/property
 * PUT /api/services/:id
 */
export const updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    name, 
    description, 
    category, 
    price,
    propertyType,
    bedrooms,
    bathrooms,
    maxGuests,
    amenities,
    images,
    address,
    unavailableDates,
    isActive
  } = req.body;
  
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  // Check if service exists
  const service = await Service.findById(req.params['id']);
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  // Check if user owns the service or is admin
  if (service.provider.toString() !== (req.user._id ? req.user._id.toString() : '') && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this property', 403);
  }
  
  // Verify category exists if provided
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Update service with all possible fields
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (price !== undefined) updateData.price = price;
  if (propertyType !== undefined) updateData.propertyType = propertyType;
  if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
  if (bathrooms !== undefined) updateData.bathrooms = bathrooms;
  if (maxGuests !== undefined) updateData.maxGuests = maxGuests;
  if (amenities !== undefined) updateData.amenities = amenities;
  if (images !== undefined) updateData.images = images;
  if (address !== undefined) updateData.address = address;
  if (unavailableDates !== undefined) updateData.unavailableDates = unavailableDates;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const updatedService = await Service.findByIdAndUpdate(
    req.params['id'],
    updateData,
    { new: true, runValidators: true }
  ).populate('category', 'name description')
   .populate('provider', 'firstName lastName email');
  
  res.status(200).json(successResponse(updatedService, 'Property updated successfully'));
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

export const blockDates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dates, reason } = req.body;

    // Validate that dates is an array
    if (!Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Dates array is required and cannot be empty'
      });
      return;
    }

    // Convert dates to Date objects and validate
    const dateObjects = dates.map(dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      // Set to start of day to avoid timezone issues
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    // Check if user is admin or owns the service
    const user = req.user as IUser;
    if (user.role !== 'admin' && service.provider.toString() !== user._id?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin or service owner required.'
      });
      return;
    }

    // Add dates to unavailable dates (avoid duplicates)
    const existingDates = service.unavailableDates?.map((d: Date) => d.getTime()) || [];
    const newDates = dateObjects.filter(date => !existingDates.includes(date.getTime()));
    
    if (newDates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'All specified dates are already blocked'
      });
      return;
    }

    service.unavailableDates = [...(service.unavailableDates || []), ...newDates];
    await service.save();

    res.status(200).json({
      success: true,
      message: `Successfully blocked ${newDates.length} dates`,
      data: {
        serviceId: service._id,
        blockedDates: newDates,
        reason: reason || 'Manual block by admin',
        totalUnavailableDates: service.unavailableDates.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error blocking dates'
    });
  }
};

export const unblockDates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dates } = req.body;

    // Validate that dates is an array
    if (!Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Dates array is required and cannot be empty'
      });
      return;
    }

    // Convert dates to Date objects and validate
    const dateObjects = dates.map(dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      // Set to start of day to avoid timezone issues
      date.setHours(0, 0, 0, 0);
      return date.getTime(); // Use timestamp for comparison
    });

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    // Check if user is admin or owns the service
    const user = req.user as IUser;
    if (user.role !== 'admin' && service.provider.toString() !== user._id?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin or service owner required.'
      });
      return;
    }

    // Remove dates from unavailable dates
    const originalCount = service.unavailableDates?.length || 0;
    service.unavailableDates = service.unavailableDates?.filter(
      (date: Date) => !dateObjects.includes(date.getTime())
    ) || [];
    
    const removedCount = originalCount - service.unavailableDates.length;
    
    if (removedCount === 0) {
      res.status(400).json({
        success: false,
        message: 'None of the specified dates were blocked'
      });
      return;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: `Successfully unblocked ${removedCount} dates`,
      data: {
        serviceId: service._id,
        unblockedCount: removedCount,
        totalUnavailableDates: service.unavailableDates.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error unblocking dates'
    });
  }
};

export const getAvailableCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, month, year } = req.query;

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    let start: Date;
    let end: Date;

    // Handle different date range inputs
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (month && year) {
      start = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      end = new Date(parseInt(year as string), parseInt(month as string), 0);
    } else {
      // Default to current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }

    // Get all dates in range
    const calendar = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isUnavailable = service.unavailableDates?.some(
        (unavailableDate: Date) => unavailableDate.toISOString().split('T')[0] === dateStr
      ) || false;

      calendar.push({
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        isAvailable: !isUnavailable,
        isUnavailable: isUnavailable
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.name,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        calendar,
        summary: {
          totalDays: calendar.length,
          availableDays: calendar.filter(day => day.isAvailable).length,
          unavailableDays: calendar.filter(day => day.isUnavailable).length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving calendar'
    });
  }
};

export const checkAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
      return;
    }

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    const checkIn = new Date(checkInDate as string);
    const checkOut = new Date(checkOutDate as string);

    // Validate dates
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }

    if (checkIn >= checkOut) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
      return;
    }

    // Check if any dates in the range are unavailable
    const unavailableDates = service.unavailableDates || [];
    const conflictingDates = [];
    
    const currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isUnavailable = unavailableDates.some(
        (unavailableDate: Date) => unavailableDate.toISOString().split('T')[0] === dateStr
      );
      
      if (isUnavailable) {
        conflictingDates.push(dateStr);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const isAvailable = conflictingDates.length === 0;

    res.status(200).json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.name,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        isAvailable,
        conflictingDates,
        message: isAvailable 
          ? 'Property is available for the selected dates'
          : `Property is not available. Conflicting dates: ${conflictingDates.join(', ')}`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking availability'
    });
  }
};

/**
 * Upload images for a property
 * POST /api/services/:id/images
 */
export const uploadPropertyImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const serviceId = req.params['id'];
  const files = req.files as Express.Multer.File[];
  
  if (!serviceId) {
    throw new AppError('Property ID is required', 400);
  }
  
  if (!files || files.length === 0) {
    throw new AppError('No images provided', 400);
  }
  
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  // Check authorization - admin or property owner
  if (!req.user?._id || (req.user.role !== 'admin' && service.provider.toString() !== req.user._id.toString())) {
    throw new AppError('Not authorized to upload images for this property', 403);
  }
  
  const uploadedImages = [];
  
  try {
    // Process each uploaded file
    for (const file of files) {
      // Generate different sizes (thumbnail, medium, full)
      const sizes = [
        { width: 150, height: 150, suffix: 'thumb' },
        { width: 500, height: 300, suffix: 'medium' },
        { width: 1200, height: 800, suffix: 'full' }
      ];
      
      // Process image sizes
      await processImage(file.path, sizes);
      
      // Generate image URL
      const imageUrl = generateImageUrl(serviceId, file.filename);
      
      uploadedImages.push({
        url: imageUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      });
    }
    
    // Add new image URLs to service
    const currentImages = service.images || [];
    service.images = [...currentImages, ...uploadedImages.map(img => img.url)];
    
    await service.save();
    
    res.status(201).json(createdResponse({
      serviceId: service._id,
      uploadedImages,
      totalImages: service.images.length
    }, 'Images uploaded successfully'));
    
  } catch (error) {
    // Clean up uploaded files if processing failed
    files.forEach(file => {
      deleteImageFile(file.path);
    });
    throw error;
  }
});

/**
 * Delete a specific image from a property
 * DELETE /api/services/:id/images/:imageId
 */
export const deletePropertyImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const serviceId = req.params['id'];
  const imageUrl = req.params['imageId']; // This will be the full image URL or filename
  
  if (!serviceId) {
    throw new AppError('Property ID is required', 400);
  }
  
  if (!imageUrl) {
    throw new AppError('Image ID is required', 400);
  }
  
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  // Check authorization - admin or property owner
  if (!req.user?._id || (req.user.role !== 'admin' && service.provider.toString() !== req.user._id.toString())) {
    throw new AppError('Not authorized to delete images for this property', 403);
  }
  
  // Find the image URL in the service images array
  const imageToDelete = service.images?.find(img => 
    img.includes(imageUrl) || img === imageUrl
  );
  
  if (!imageToDelete) {
    throw new AppError('Image not found', 404);
  }
  
  // Extract filename from URL
  const filename = extractFilenameFromUrl(imageToDelete);
  if (!filename) {
    throw new AppError('Invalid image URL', 400);
  }
  
  // Delete physical files (all sizes)
  const propertyDir = path.join(process.cwd(), 'uploads', 'images', 'properties', serviceId);
  const baseName = path.parse(filename).name;
  const ext = path.parse(filename).ext;
  
  // Delete all image sizes
  const sizeSuffixes = ['thumb', 'medium', 'full'];
  sizeSuffixes.forEach(suffix => {
    const sizedFilename = `${baseName}_${suffix}${ext}`;
    const filePath = path.join(propertyDir, sizedFilename);
    deleteImageFile(filePath);
  });
  
  // Delete original file
  const originalPath = path.join(propertyDir, filename);
  deleteImageFile(originalPath);
  
  // Remove from service images array
  service.images = service.images?.filter(img => img !== imageToDelete) || [];
  await service.save();
  
  res.status(200).json(successResponse({
    serviceId: service._id,
    deletedImage: imageToDelete,
    remainingImages: service.images.length
  }, 'Image deleted successfully'));
});

/**
 * Get all images for a property
 * GET /api/services/:id/images
 */
export const getPropertyImages = asyncHandler(async (req: Request, res: Response) => {
  const serviceId = req.params['id'];
  
  if (!serviceId) {
    throw new AppError('Property ID is required', 400);
  }
  
  const service = await Service.findById(serviceId).select('images name');
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  const images = service.images?.map(url => {
    const filename = extractFilenameFromUrl(url);
    return {
      url,
      filename,
      thumbnailUrl: url.replace(/\/([^\/]+)$/, '/$1').replace(/(\.[^.]+)$/, '_thumb$1'),
      mediumUrl: url.replace(/\/([^\/]+)$/, '/$1').replace(/(\.[^.]+)$/, '_medium$1'),
      fullUrl: url.replace(/\/([^\/]+)$/, '/$1').replace(/(\.[^.]+)$/, '_full$1')
    };
  }) || [];
  
  res.status(200).json(successResponse({
    serviceId: service._id,
    serviceName: service.name,
    images,
    totalImages: images.length
  }, 'Images retrieved successfully'));
});

/**
 * Reorder property images
 * PUT /api/services/:id/images/reorder
 */
export const reorderPropertyImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const serviceId = req.params['id'];
  const { imageUrls } = req.body;
  
  if (!serviceId) {
    throw new AppError('Property ID is required', 400);
  }
  
  if (!Array.isArray(imageUrls)) {
    throw new AppError('imageUrls must be an array', 400);
  }
  
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  // Check authorization - admin or property owner
  if (!req.user?._id || (req.user.role !== 'admin' && service.provider.toString() !== req.user._id.toString())) {
    throw new AppError('Not authorized to reorder images for this property', 403);
  }
  
  // Validate that all provided URLs exist in the current images
  const currentImages = service.images || [];
  const invalidUrls = imageUrls.filter(url => !currentImages.includes(url));
  
  if (invalidUrls.length > 0) {
    throw new AppError(`Invalid image URLs: ${invalidUrls.join(', ')}`, 400);
  }
  
  // Update the images array with new order
  service.images = imageUrls;
  await service.save();
  
  res.status(200).json(successResponse({
    serviceId: service._id,
    images: service.images,
    totalImages: service.images.length
  }, 'Images reordered successfully'));
});

/**
 * Set primary image for a property
 * PUT /api/services/:id/images/primary
 */
export const setPrimaryImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const serviceId = req.params['id'];
  const { imageUrl } = req.body;
  
  if (!serviceId) {
    throw new AppError('Property ID is required', 400);
  }
  
  if (!imageUrl) {
    throw new AppError('imageUrl is required', 400);
  }
  
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('Property not found', 404);
  }
  
  // Check authorization - admin or property owner
  if (!req.user?._id || (req.user.role !== 'admin' && service.provider.toString() !== req.user._id.toString())) {
    throw new AppError('Not authorized to set primary image for this property', 403);
  }
  
  // Check if the image URL exists in the current images
  const currentImages = service.images || [];
  if (!currentImages.includes(imageUrl)) {
    throw new AppError('Image URL not found in property images', 404);
  }
  
  // Move the selected image to the first position
  const otherImages = currentImages.filter(url => url !== imageUrl);
  service.images = [imageUrl, ...otherImages];
  
  await service.save();
  
  res.status(200).json(successResponse({
    serviceId: service._id,
    primaryImage: imageUrl,
    images: service.images,
    totalImages: service.images.length
  }, 'Primary image set successfully'));
}); 

/**
 * Update property inventory
 * PUT /api/services/:id/inventory
 */
export const updateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { totalUnits, availableUnits, minBookingDays, maxBookingDays } = req.body;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Find the service/property
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Property not found', 404);
  }

  // Check authorization (only property owner or admin can update inventory)
  if (req.user.role !== 'admin' && service.provider.toString() !== req.user._id?.toString()) {
    throw new AppError('Not authorized to update this property inventory', 403);
  }

  // Validate inventory data
  if (availableUnits > totalUnits) {
    throw new AppError('Available units cannot exceed total units', 400);
  }

  if (minBookingDays > maxBookingDays) {
    throw new AppError('Minimum booking days cannot exceed maximum booking days', 400);
  }

  // Update inventory
  const updatedService = await Service.findByIdAndUpdate(
    id,
    {
      inventory: {
        totalUnits,
        availableUnits,
        minBookingDays,
        maxBookingDays
      }
    },
    { new: true, runValidators: true }
  ).populate('category', 'name description')
   .populate('provider', 'firstName lastName email');

  res.status(200).json(successResponse(updatedService, 'Property inventory updated successfully'));
});

/**
 * Get property inventory statistics
 * GET /api/services/:id/inventory/stats
 */
export const getInventoryStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Find the service/property
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Property not found', 404);
  }

  // Check authorization (only property owner or admin can view inventory stats)
  if (req.user.role !== 'admin' && service.provider.toString() !== req.user._id?.toString()) {
    throw new AppError('Not authorized to view this property inventory', 403);
  }

  // Import inventory utilities
  const { getInventoryStatistics } = await import('../utils/inventoryUtils');
  
  // Get inventory statistics
  const stats = await getInventoryStatistics(id!);

  res.status(200).json(successResponse(stats, 'Inventory statistics retrieved successfully'));
});

/**
 * Check inventory availability for a date range
 * POST /api/services/:id/inventory/availability
 */
export const checkInventoryAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate, units = 1 } = req.body;

  // Find the service/property
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Property not found', 404);
  }

  if (!service.inventory) {
    throw new AppError('Property inventory not configured', 400);
  }

  // Import inventory utilities
  const { checkInventoryAvailability: checkAvailability } = await import('../utils/inventoryUtils');
  
  // Check availability
  const availability = await checkAvailability(id!, new Date(startDate), new Date(endDate), units);

  res.status(200).json(successResponse(availability, 'Inventory availability checked successfully'));
});

/**
 * Adjust property inventory (for admin use)
 * PATCH /api/services/:id/inventory/adjust
 */
export const adjustInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { adjustment, reason } = req.body;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Only admins can adjust inventory
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can adjust inventory', 403);
  }

  // Find the service/property
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Property not found', 404);
  }

  if (!service.inventory) {
    throw new AppError('Property inventory not configured', 400);
  }

  // Calculate new available units
  const newAvailableUnits = Math.max(0, Math.min(
    service.inventory.totalUnits,
    service.inventory.availableUnits + adjustment
  ));

  // Update inventory
  const updatedService = await Service.findByIdAndUpdate(
    id,
    {
      'inventory.availableUnits': newAvailableUnits
    },
    { new: true, runValidators: true }
  ).populate('category', 'name description')
   .populate('provider', 'firstName lastName email');

  res.status(200).json(successResponse({
    service: updatedService,
    adjustment,
    reason,
    previousAvailableUnits: service.inventory.availableUnits,
    newAvailableUnits
  }, 'Inventory adjusted successfully'));
});

/**
 * Bulk update inventory for multiple properties (admin only)
 * POST /api/services/inventory/bulk-update
 */
export const bulkUpdateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { updates } = req.body;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Only admins can perform bulk updates
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can perform bulk inventory updates', 403);
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('Updates array is required and cannot be empty', 400);
  }

  // Import inventory utilities
  const { bulkUpdateInventory: bulkUpdate } = await import('../utils/inventoryUtils');
  
  // Perform bulk update
  const result = await bulkUpdate(updates);

  res.status(200).json(successResponse(result, 'Bulk inventory update completed'));
}); 