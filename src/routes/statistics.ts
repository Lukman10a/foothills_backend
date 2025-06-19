import express from 'express';
import {
  getDashboardStats,
  getBookingTrends,
  getServiceStats,
  getCategoryStats,
  getUserStats
} from '../controllers/statisticsController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = express.Router();

// All statistics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/statistics/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/statistics/trends
 * @desc    Get booking trends over time
 * @access  Private
 */
router.get('/trends', getBookingTrends);

/**
 * @route   GET /api/statistics/services
 * @desc    Get service performance statistics
 * @access  Private
 */
router.get('/services', getServiceStats);

/**
 * @route   GET /api/statistics/categories
 * @desc    Get category performance statistics
 * @access  Private
 */
router.get('/categories', getCategoryStats);

/**
 * @route   GET /api/statistics/users
 * @desc    Get user activity statistics
 * @access  Admin only
 */
router.get('/users', authorize(['admin']), getUserStats);

export default router; 