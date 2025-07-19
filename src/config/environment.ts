import Joi from 'joi';
import dotenv from 'dotenv';
import { Environment } from '../types';

// Load environment variables first
dotenv.config();

// Normalize NODE_ENV to lowercase for validation
const normalizedNodeEnv = process.env['NODE_ENV']?.toLowerCase() || 'development';

// Environment variable validation schema
const envSchema = Joi.object<Environment>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV must be one of: development, production, test'
    }),
  
  PORT: Joi.number()
    .default(3000),
  
  MONGODB_URI: Joi.string()
    .default('mongodb://localhost:27017/foothills')
    .description('MongoDB connection string'),
  
  MONGODB_URI_TEST: Joi.string()
    .description('MongoDB test connection string'),
  
  JWT_SECRET: Joi.string()
    .default('foothills-super-secret-jwt-key-for-development-only')
    .min(32)
    .description('JWT secret key'),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT token expiration time'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000) // 15 minutes
    .description('Rate limiting window in milliseconds'),
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100)
    .description('Maximum requests per window'),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .description('CORS allowed origin')
}).unknown();

// Validate environment variables
const validateEnv = (): Environment => {
  // Create a normalized environment object
  const normalizedEnv = {
    ...process.env,
    NODE_ENV: normalizedNodeEnv,
    PORT: process.env['PORT'] ? parseInt(process.env['PORT']) : undefined,
    RATE_LIMIT_WINDOW_MS: process.env['RATE_LIMIT_WINDOW_MS'] ? parseInt(process.env['RATE_LIMIT_WINDOW_MS']) : undefined,
    RATE_LIMIT_MAX_REQUESTS: process.env['RATE_LIMIT_MAX_REQUESTS'] ? parseInt(process.env['RATE_LIMIT_MAX_REQUESTS']) : undefined
  };

  const { error, value: envVars } = envSchema.validate(normalizedEnv);
  
  if (error) {
    console.error('❌ Environment validation failed:');
    console.error('Error:', error.message);
    console.error('Current NODE_ENV:', process.env['NODE_ENV']);
    console.error('Normalized NODE_ENV:', normalizedNodeEnv);
    console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('NODE') || key.includes('PORT') || key.includes('MONGO')));
    throw new Error(`Environment validation error: ${error.message}`);
  }
  
  return envVars as Environment;
};

// Get validated environment variables
const env = validateEnv();

const isDevelopment = env.NODE_ENV === 'development';
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export {
  env,
  isDevelopment,
  isProduction,
  isTest
}; 