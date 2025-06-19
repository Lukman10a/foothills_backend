import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import authRoutes from './auth';
import categoryRoutes from './categories';
import serviceRoutes from './services';
import bookingRoutes from './bookings';
import statisticsRoutes from './statistics';

const router = Router();

// Import route modules (will be created in next phases)
// import userRoutes from './users';

// Apply rate limiting to public routes
router.use(publicLimiter);

/**
 * @route   GET /api
 * @desc    API documentation and available endpoints
 * @access  Public
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Foothills Booking Platform API',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        get: 'GET /api/categories/:id',
        update: 'PUT /api/categories/:id',
        delete: 'DELETE /api/categories/:id'
      },
      services: {
        list: 'GET /api/services',
        create: 'POST /api/services',
        get: 'GET /api/services/:id',
        update: 'PUT /api/services/:id',
        delete: 'DELETE /api/services/:id',
        byProvider: 'GET /api/services/provider/:providerId'
      },
      bookings: {
        list: 'GET /api/bookings',
        create: 'POST /api/bookings',
        get: 'GET /api/bookings/:id',
        update: 'PUT /api/bookings/:id',
        cancel: 'DELETE /api/bookings/:id',
        byUser: 'GET /api/bookings/user/:userId'
      },
      statistics: {
        dashboard: 'GET /api/statistics/dashboard',
        trends: 'GET /api/statistics/trends',
        services: 'GET /api/statistics/services',
        categories: 'GET /api/statistics/categories',
        users: 'GET /api/statistics/users'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rate_limiting: {
      window: '15 minutes',
      max_requests: '100 requests per window'
    },
    advanced_features: {
      search: 'Use ?search=term for text search',
      filtering: 'Use ?category=id&provider=id&priceMin=100&priceMax=500',
      sorting: 'Use ?sort=field&order=asc|desc',
      pagination: 'Use ?page=1&limit=10'
    }
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Foothills API is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0'
  });
});

// Mount route modules (will be uncommented as we create them)
// router.use('/users', userRoutes);

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/statistics', statisticsRoutes);

export default router; 