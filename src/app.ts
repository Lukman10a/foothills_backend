import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import configurations and middleware
import connectDB from './config/database';
import { env } from './config/environment';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Import routes
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalLimiter);

// Request logging middleware (development only)
if (env.NODE_ENV === 'development') {
  app.use((_req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${_req.method} ${_req.originalUrl}`);
    next();
  });
}

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Foothills Booking Platform API',
    version: '1.0.0',
    status: 'operational',
    environment: env.NODE_ENV,
    documentation: '/api',
    health: '/api/health'
  });
});

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = env.PORT;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Foothills API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 CORS Origin: ${env.CORS_ORIGIN}`);
  });
}

export default app; 