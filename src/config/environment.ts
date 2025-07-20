import Joi from 'joi';
import dotenv from 'dotenv';
import { Environment } from '../types';

// Load environment variables first
dotenv.config();

// Render-specific environment handling
const isRenderEnvironment = process.env['RENDER'] === 'true' || process.env['RENDER_SERVICE_NAME'];

// Get NODE_ENV with fallbacks for Render
const getNodeEnv = (): string => {
  const nodeEnv = process.env['NODE_ENV'];
  
  // If running on Render and NODE_ENV is not set, default to production
  if (isRenderEnvironment && !nodeEnv) {
    return 'production';
  }
  
  // Normalize to lowercase and trim whitespace
  return (nodeEnv || 'development').toLowerCase().trim();
};

const normalizedNodeEnv = getNodeEnv();

// Environment variable validation schema with more lenient validation for production
const envSchema = Joi.object<Environment>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('production') // Default to production for Render
    .messages({
      'any.only': 'NODE_ENV must be one of: development, production, test. Current value: {{#value}}'
    }),
  
  PORT: Joi.number()
    .default(isRenderEnvironment ? 10000 : 3000), // Render uses port 10000
  
  MONGODB_URI: Joi.string()
    .required()
    .messages({
      'any.required': 'MONGODB_URI is required. Please set your MongoDB connection string.'
    }),
  
  MONGODB_URI_TEST: Joi.string()
    .optional(),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_SECRET is required. Please set a secure JWT secret.',
      'string.min': 'JWT_SECRET must be at least 32 characters long for security.'
    }),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('24h'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100),
  
  CORS_ORIGIN: Joi.string()
    .default(isRenderEnvironment ? '*' : 'http://localhost:3000')
}).unknown();

// Validate environment variables with detailed error reporting
const validateEnv = (): Environment => {
  // Create environment object with proper type conversion
  const envToValidate = {
    NODE_ENV: normalizedNodeEnv,
    PORT: process.env['PORT'] ? parseInt(process.env['PORT'], 10) : undefined,
    MONGODB_URI: process.env['MONGODB_URI'],
    MONGODB_URI_TEST: process.env['MONGODB_URI_TEST'],
    JWT_SECRET: process.env['JWT_SECRET'],
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'],
    RATE_LIMIT_WINDOW_MS: process.env['RATE_LIMIT_WINDOW_MS'] ? parseInt(process.env['RATE_LIMIT_WINDOW_MS'], 10) : undefined,
    RATE_LIMIT_MAX_REQUESTS: process.env['RATE_LIMIT_MAX_REQUESTS'] ? parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'], 10) : undefined,
    CORS_ORIGIN: process.env['CORS_ORIGIN']
  };

  const { error, value: envVars } = envSchema.validate(envToValidate, {
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    console.error('🚨 Environment Validation Failed');
    console.error('=====================================');
    console.error('Error Details:', error.message);
    console.error('');
    console.error('🔍 Environment Debug Information:');
    console.error('- Is Render Environment:', isRenderEnvironment);
    console.error('- Raw NODE_ENV:', JSON.stringify(process.env['NODE_ENV']));
    console.error('- Normalized NODE_ENV:', JSON.stringify(normalizedNodeEnv));
    console.error('- PORT:', process.env['PORT']);
    console.error('- MONGODB_URI exists:', !!process.env['MONGODB_URI']);
    console.error('- JWT_SECRET exists:', !!process.env['JWT_SECRET']);
    console.error('- JWT_SECRET length:', process.env['JWT_SECRET']?.length || 0);
    console.error('');
    console.error('📋 Available Environment Variables:');
    const relevantEnvVars = Object.keys(process.env).filter(key => 
      key.includes('NODE') || 
      key.includes('PORT') || 
      key.includes('MONGO') || 
      key.includes('JWT') ||
      key.includes('RENDER')
    );
    relevantEnvVars.forEach(key => {
      const value = process.env[key];
      const displayValue = key.includes('SECRET') || key.includes('URI') 
        ? `${value?.substring(0, 10)}...` 
        : value;
      console.error(`  ${key}: ${displayValue}`);
    });
    console.error('');
    console.error('💡 Fix Instructions:');
    console.error('1. Go to Render Dashboard → Your Service → Environment');
    console.error('2. Add these required environment variables:');
    console.error('   - NODE_ENV: production');
    console.error('   - MONGODB_URI: your-mongodb-connection-string');
    console.error('   - JWT_SECRET: your-secure-jwt-secret');
    console.error('3. Save and redeploy');
    
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  
  return envVars as Environment;
};

// Get validated environment variables
let env: Environment;

try {
  env = validateEnv();
  console.log('✅ Environment validation successful');
  console.log(`🌍 Running in ${env.NODE_ENV} mode`);
  if (isRenderEnvironment) {
    console.log('🚀 Detected Render deployment environment');
  }
} catch (error) {
  console.error('❌ Failed to validate environment variables');
  throw error;
}

const isDevelopment = env.NODE_ENV === 'development';
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export {
  env,
  isDevelopment,
  isProduction,
  isTest
}; 