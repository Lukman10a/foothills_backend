#!/usr/bin/env node

/**
 * Render Deployment Checklist
 * Validates environment setup for Render deployment
 */

const crypto = require('crypto');

console.log('🚀 Render Deployment Checklist for Foothills API');
console.log('================================================\n');

// Check if we're in a deployment environment
const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_NAME;
const nodeEnv = process.env.NODE_ENV;

console.log('📋 Environment Status:');
console.log(`   Environment: ${isRender ? '🌐 Render' : '💻 Local'}`);
console.log(`   NODE_ENV: ${nodeEnv || '❌ NOT SET'}`);
console.log('');

// Required environment variables for Render
const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI', 
  'JWT_SECRET'
];

const optionalEnvVars = [
  'PORT',
  'JWT_EXPIRES_IN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'CORS_ORIGIN'
];

console.log('🔍 Required Environment Variables:');
let missingRequired = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const status = exists ? '✅' : '❌';
  
  if (!exists) missingRequired.push(varName);
  
  if (varName === 'JWT_SECRET' && exists) {
    console.log(`   ${status} ${varName}: ${value.length} characters`);
    if (value.length < 32) {
      console.log(`      ⚠️  WARNING: JWT_SECRET should be at least 32 characters`);
    }
  } else if (varName === 'MONGODB_URI' && exists) {
    const isAtlas = value.includes('mongodb+srv://');
    console.log(`   ${status} ${varName}: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
  } else {
    console.log(`   ${status} ${varName}: ${exists ? '✅ Set' : '❌ Missing'}`);
  }
});

console.log('\n🔧 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const status = exists ? '✅' : '⚪';
  console.log(`   ${status} ${varName}: ${value || 'Using default'}`);
});

console.log('\n');

if (missingRequired.length > 0) {
  console.log('❌ DEPLOYMENT WILL FAIL');
  console.log('Missing required environment variables:', missingRequired.join(', '));
  console.log('');
  console.log('🔧 HOW TO FIX:');
  console.log('1. Go to your Render dashboard');
  console.log('2. Navigate to your service → Environment tab');
  console.log('3. Add these environment variables:');
  console.log('');
  
  if (missingRequired.includes('NODE_ENV')) {
    console.log('   NODE_ENV = production');
  }
  
  if (missingRequired.includes('MONGODB_URI')) {
    console.log('   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/foothills?retryWrites=true&w=majority');
    console.log('   (Replace with your actual MongoDB Atlas connection string)');
  }
  
  if (missingRequired.includes('JWT_SECRET')) {
    const newSecret = crypto.randomBytes(64).toString('hex');
    console.log(`   JWT_SECRET = ${newSecret}`);
    console.log('   (Use the secure secret generated above)');
  }
  
  console.log('');
  console.log('4. Save changes and redeploy');
  
} else {
  console.log('✅ ALL REQUIRED VARIABLES SET');
  console.log('Your deployment should succeed!');
  
  if (isRender) {
    console.log('\n🚀 Render Deployment Ready');
  } else {
    console.log('\n💻 Local Development Ready');
  }
}

console.log('\n📚 Additional Resources:');
console.log('   • Render Docs: https://render.com/docs/environment-variables');
console.log('   • MongoDB Atlas: https://cloud.mongodb.com/');
console.log('   • Troubleshooting: https://render.com/docs/troubleshooting-deploys');

console.log('\n🎯 Quick Test Commands:');
console.log('   Health Check: curl https://your-app.onrender.com/api/health');
console.log('   API Docs: curl https://your-app.onrender.com/api');

process.exit(missingRequired.length > 0 ? 1 : 0); 