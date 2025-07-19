#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates cryptographically secure JWT secrets for production use
 */

const crypto = require('crypto');

console.log('🔐 JWT Secret Generator for Foothills API\n');

// Generate multiple secure options
const secrets = {
  hex: crypto.randomBytes(64).toString('hex'),
  base64: crypto.randomBytes(64).toString('base64'),
  base64url: crypto.randomBytes(64).toString('base64url')
};

console.log('📋 Generated JWT Secrets:\n');

console.log('🏆 RECOMMENDED - Hex Format (128 chars):');
console.log(secrets.hex);
console.log('\n📝 Copy this value to your Render environment variables');
console.log('   Key: JWT_SECRET');
console.log(`   Value: ${secrets.hex}`);

console.log('\n🔄 Alternative - Base64 Format:');
console.log(secrets.base64);

console.log('\n🌐 Alternative - URL Safe Base64:');
console.log(secrets.base64url);

console.log('\n⚠️  SECURITY NOTES:');
console.log('   • Never commit JWT secrets to version control');
console.log('   • Use different secrets for development and production');
console.log('   • Store secrets securely in environment variables');
console.log('   • Rotate secrets periodically for maximum security');

console.log('\n✅ Your JWT secret is ready for production use!'); 