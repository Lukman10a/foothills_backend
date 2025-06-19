import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { JWTPayload, IUser } from '../types';

/**
 * Generate JWT token for user
 * @param user - User object
 * @returns JWT token
 */
export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'foothills-api',
    audience: 'foothills-users'
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'foothills-api',
      audience: 'foothills-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns JWT token
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must start with Bearer');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    throw new Error('Token is required');
  }

  return token;
};

/**
 * Check if user has required role
 * @param userRole - User's role
 * @param requiredRoles - Array of required roles
 * @returns Boolean indicating if user has required role
 */
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user is admin
 * @param userRole - User's role
 * @returns Boolean indicating if user is admin
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === 'admin';
};

/**
 * Check if user is provider
 * @param userRole - User's role
 * @returns Boolean indicating if user is provider
 */
export const isProvider = (userRole: string): boolean => {
  return userRole === 'provider';
};

/**
 * Check if user is customer
 * @param userRole - User's role
 * @returns Boolean indicating if user is customer
 */
export const isCustomer = (userRole: string): boolean => {
  return userRole === 'customer';
}; 