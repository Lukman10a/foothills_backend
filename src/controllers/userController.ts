import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import { 
  buildSearchQuery, 
  buildSortQuery, 
  buildPaginationOptions, 
  createPaginatedResponse,
  sanitizeSearchInput 
} from '../utils/searchUtils';
import User from '../models/User';
import Booking from '../models/Booking';
import Service from '../models/Service';

/**
 * Get all users with advanced filtering and search (Admin only)
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { 
    search, 
    sort = 'createdAt',
    order = 'desc',
    role,
    isActive,
    startDate,
    endDate
  } = req.query;

  // Build search query
  const searchFields = ['firstName', 'lastName', 'email'];
  const searchQuery = search ? buildSearchQuery(sanitizeSearchInput(search as string), searchFields) : {};

  // Build filter query
  const filterQuery: any = {};
  
  if (role) filterQuery.role = role;
  if (isActive !== undefined) filterQuery.isActive = isActive === 'true';
  
  // Date range filter for user registration
  if (startDate || endDate) {
    filterQuery.createdAt = {};
    if (startDate) filterQuery.createdAt.$gte = new Date(startDate as string);
    if (endDate) filterQuery.createdAt.$lte = new Date(endDate as string);
  }

  // Combine search and filter queries
  const combinedFilter = { ...searchQuery, ...filterQuery };

  // Build sort query
  const allowedSortFields = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt'];
  const sortQuery = buildSortQuery(
    { sort: `${order === 'desc' ? '-' : ''}${sort}` },
    { createdAt: -1 },
    allowedSortFields
  );

  // Build pagination options
  const { page: pageNum, limit: limitNum, skip } = buildPaginationOptions(req.query, 10, 100);

  // Execute query with aggregation for enhanced data
  const pipeline = [
    { $match: combinedFilter },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customer',
        as: 'bookings'
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: 'provider',
        as: 'services'
      }
    },
    {
      $addFields: {
        totalBookings: { $size: '$bookings' },
        totalServices: { $size: '$services' },
        fullName: { $concat: ['$firstName', ' ', '$lastName'] }
      }
    },
    {
      $project: {
        password: 0,
        bookings: 0,
        services: 0
      }
    },
    { $sort: sortQuery },
    { $skip: skip },
    { $limit: limitNum }
  ];

  // Execute aggregation
  const users = await User.aggregate(pipeline);
  const total = await User.countDocuments(combinedFilter);

  // Create paginated response
  const paginatedResponse = createPaginatedResponse(users, total, pageNum, limitNum);

  res.status(200).json(successResponse(paginatedResponse, 'Users retrieved successfully'));
});

/**
 * Get user by ID with detailed information (Admin only)
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userId = req.params['id'] as string;

  // Validate ObjectId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Get user with related data
  const userPipeline = [
    { $match: { _id: new Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customer',
        as: 'bookings'
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: 'provider',
        as: 'services'
      }
    },
    {
      $addFields: {
        totalBookings: { $size: '$bookings' },
        totalServices: { $size: '$services' },
        fullName: { $concat: ['$firstName', ' ', '$lastName'] }
      }
    },
    {
      $project: {
        password: 0
      }
    }
  ];

  const userResult = await User.aggregate(userPipeline);
  
  if (!userResult || userResult.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userResult[0];

  res.status(200).json(successResponse(user, 'User retrieved successfully'));
});

/**
 * Create new user (Admin only)
 * POST /api/admin/users
 */
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const { email, password, firstName, lastName, role = 'customer', isActive = true } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    isActive
  });

  // Return user data without password
  const userData = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    fullName: `${user.firstName} ${user.lastName}`,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  res.status(201).json(createdResponse(userData, 'User created successfully'));
});

/**
 * Update user information (Admin only)
 * PUT /api/admin/users/:id
 */
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userId = req.params['id'] as string;
  const { email, firstName, lastName, role, isActive } = req.body;

  // Validate ObjectId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (userId === req.user._id?.toString() && isActive === false) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }
  }

  // Update user fields
  const updateFields: any = {};
  if (email) updateFields.email = email;
  if (firstName) updateFields.firstName = firstName;
  if (lastName) updateFields.lastName = lastName;
  if (role) updateFields.role = role;
  if (isActive !== undefined) updateFields.isActive = isActive;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new AppError('Failed to update user', 500);
  }

  // Return updated user data without password
  const userData = {
    id: updatedUser._id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };

  res.status(200).json(successResponse(userData, 'User updated successfully'));
});

/**
 * Update user role (Admin only)
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userId = req.params['id'] as string;
  const { role } = req.body;

  // Validate ObjectId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Validate role
  const validRoles = ['customer', 'provider', 'admin'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role. Must be one of: customer, provider, admin', 400);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from changing their own role
  if (userId === req.user._id?.toString()) {
    throw new AppError('Cannot change your own role', 400);
  }

  // Update user role
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new AppError('Failed to update user role', 500);
  }

  // Return updated user data without password
  const userData = {
    id: updatedUser._id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };

  res.status(200).json(successResponse(userData, 'User role updated successfully'));
});

/**
 * Activate/Deactivate user (Admin only)
 * PATCH /api/admin/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userId = req.params['id'] as string;
  const { isActive } = req.body;

  // Validate ObjectId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Validate isActive
  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean value', 400);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (userId === req.user._id?.toString() && isActive === false) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  // Update user status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new AppError('Failed to update user status', 500);
  }

  // Return updated user data without password
  const userData = {
    id: updatedUser._id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };

  const message = isActive ? 'User activated successfully' : 'User deactivated successfully';
  res.status(200).json(successResponse(userData, message));
});

/**
 * Delete user (Admin only) - Soft delete
 * DELETE /api/admin/users/:id
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userId = req.params['id'] as string;

  // Validate ObjectId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (userId === req.user._id?.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Check if user has active bookings
  const activeBookings = await Booking.countDocuments({
    customer: userId,
    status: { $in: ['pending', 'confirmed'] }
  });

  if (activeBookings > 0) {
    throw new AppError('Cannot delete user with active bookings. Please cancel or complete bookings first.', 400);
  }

  // Check if user has active services (for providers)
  const activeServices = await Service.countDocuments({
    provider: userId,
    isActive: true
  });

  if (activeServices > 0) {
    throw new AppError('Cannot delete provider with active services. Please deactivate services first.', 400);
  }

  // Soft delete by deactivating the user
  const deletedUser = await User.findByIdAndUpdate(
    userId,
    { 
      isActive: false,
      deletedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  if (!deletedUser) {
    throw new AppError('Failed to delete user', 500);
  }

  res.status(200).json(successResponse(null, 'User deleted successfully'));
});

/**
 * Get user statistics (Admin only)
 * GET /api/admin/users/statistics
 */
export const getUserStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin access
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  // Get user statistics
  const [
    totalUsers,
    activeUsers,
    customerCount,
    providerCount,
    adminCount,
    recentUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'provider' }),
    User.countDocuments({ role: 'admin' }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt')
  ]);

  const statistics = {
    overview: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    },
    byRole: {
      customers: customerCount,
      providers: providerCount,
      admins: adminCount
    },
    recentUsers: recentUsers.map(user => ({
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }))
  };

  res.status(200).json(successResponse(statistics, 'User statistics retrieved successfully'));
});
