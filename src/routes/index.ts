import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import authRoutes from './auth';

const router = Router();

// Import route modules (will be created in next phases)
// import userRoutes from './users';
// import serviceRoutes from './services';
// import bookingRoutes from './bookings';
// import categoryRoutes from './categories';

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
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
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
        delete: 'DELETE /api/services/:id'
      },
      bookings: {
        list: 'GET /api/bookings',
        create: 'POST /api/bookings',
        get: 'GET /api/bookings/:id',
        update: 'PUT /api/bookings/:id',
        delete: 'DELETE /api/bookings/:id'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rate_limiting: {
      window: '15 minutes',
      max_requests: '100 requests per window'
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
// router.use('/services', serviceRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/categories', categoryRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

export default router; 