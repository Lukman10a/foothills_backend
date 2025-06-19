import Joi from 'joi';
import dotenv from 'dotenv';
import { Environment } from '../types';

// Load environment variables first
dotenv.config();

// Environment variable validation schema
const envSchema = Joi.object<Environment>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
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
  const { error, value: envVars } = envSchema.validate(process.env);
  
  if (error) {
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