import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';
import Booking from '../models/Booking';
import Service from '../models/Service';
import User from '../models/User';
import Category from '../models/Category';

/**
 * Get dashboard statistics
 * GET /api/statistics/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let filter: any = {};
  
  // Filter by user role
  if (req.user.role === 'provider') {
    filter.service = { $in: await Service.find({ provider: req.user._id }).distinct('_id') };
  } else if (req.user.role === 'customer') {
    filter.user = req.user._id;
  }

  // Get booking statistics
  const [
    totalBookings,
    monthlyBookings,
    yearlyBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings
  ] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ ...filter, createdAt: { $gte: startOfYear } }),
    Booking.countDocuments({ ...filter, status: 'pending' }),
    Booking.countDocuments({ ...filter, status: 'confirmed' }),
    Booking.countDocuments({ ...filter, status: 'completed' }),
    Booking.countDocuments({ ...filter, status: 'cancelled' })
  ]);

  // Get revenue statistics (if user is provider or admin)
  let revenue = 0;
  if (req.user.role === 'provider' || req.user.role === 'admin') {
    const completedBookings = await Booking.find({ 
      ...filter, 
      status: 'completed' 
    }).populate('service');
    
    revenue = completedBookings.reduce((total, booking) => {
      return total + (booking.service as any).price;
    }, 0);
  }

  // Get recent activity
  const recentBookings = await Booking.find(filter)
    .populate('user', 'firstName lastName')
    .populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    overview: {
      totalBookings,
      monthlyBookings,
      yearlyBookings,
      revenue
    },
    statusBreakdown: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings
    },
    recentActivity: recentBookings
  };

  res.status(200).json(successResponse(stats, 'Dashboard statistics retrieved successfully'));
});

/**
 * Get booking trends over time
 * GET /api/statistics/trends
 */
export const getBookingTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { period = 'month', startDate, endDate } = req.query;
  
  let dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };
  } else {
    // Default to last 12 months
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    dateFilter = {
      createdAt: { $gte: start, $lte: end }
    };
  }

  let filter: any = { ...dateFilter };
  
  // Filter by user role
  if (req.user.role === 'provider') {
    const serviceIds = await Service.find({ provider: req.user._id }).distinct('_id');
    filter.service = { $in: serviceIds };
  } else if (req.user.role === 'customer') {
    filter.user = req.user._id;
  }

  // Group by period
  const groupBy = period === 'day' ? {
    year: { $year: '$createdAt' },
    month: { $month: '$createdAt' },
    day: { $dayOfMonth: '$createdAt' }
  } : period === 'week' ? {
    year: { $year: '$createdAt' },
    week: { $week: '$createdAt' }
  } : {
    year: { $year: '$createdAt' },
    month: { $month: '$createdAt' }
  };

  const trends = await Booking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$service.price',
              0
            ]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
  ]);

  res.status(200).json(successResponse(trends, 'Booking trends retrieved successfully'));
});

/**
 * Get service performance statistics
 * GET /api/statistics/services
 */
export const getServiceStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  let serviceFilter: any = {};
  
  // Filter by provider if not admin
  if (req.user.role === 'provider') {
    serviceFilter.provider = req.user._id;
  }

  const serviceStats = await Service.aggregate([
    { $match: serviceFilter },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'service',
        as: 'bookings'
      }
    },
    {
      $project: {
        name: 1,
        price: 1,
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        revenue: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$bookings',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              },
              as: 'booking',
              in: '$price'
            }
          }
        },
        averageRating: { $avg: '$bookings.rating' }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  res.status(200).json(successResponse(serviceStats, 'Service statistics retrieved successfully'));
});

/**
 * Get category performance statistics
 * GET /api/statistics/categories
 */
export const getCategoryStats = asyncHandler(async (_req: Request, res: Response) => {
  const categoryStats = await Category.aggregate([
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: 'category',
        as: 'services'
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'services._id',
        foreignField: 'service',
        as: 'bookings'
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalServices: { $size: '$services' },
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        revenue: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$bookings',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              },
              as: 'booking',
              in: { $arrayElemAt: ['$services.price', 0] }
            }
          }
        }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  res.status(200).json(successResponse(categoryStats, 'Category statistics retrieved successfully'));
});

/**
 * Get user activity statistics
 * GET /api/statistics/users
 */
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  const userStats = await User.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'user',
        as: 'bookings'
      }
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        totalSpent: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$bookings',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              },
              as: 'booking',
              in: '$booking.service.price'
            }
          }
        },
        lastBooking: { $max: '$bookings.createdAt' }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  res.status(200).json(successResponse(userStats, 'User statistics retrieved successfully'));
}); 