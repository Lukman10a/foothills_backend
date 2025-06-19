import { Response, NextFunction } from 'express';
import { AuthRequest, AuthHandler } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { AppError } from './errorHandler';
import User from '../models/User';

/**
 * Authentication middleware to verify JWT token
 */
export const authenticate: AuthHandler = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Verify token
    const decoded = verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Check if user is still active (you can add more checks here)
    if (!user._id) {
      throw new AppError('User account is inactive', 401);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Authorization middleware to check user roles
 * @param roles - Array of allowed roles
 */
export const authorize = (roles: string[]): AuthHandler => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Authorization failed', 403));
      }
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin: AuthHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  return authorize(['admin'])(req, res, next);
};

/**
 * Provider-only middleware
 */
export const requireProvider: AuthHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  return authorize(['admin', 'provider'])(req, res, next);
};

/**
 * Customer-only middleware
 */
export const requireCustomer: AuthHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  return authorize(['customer', 'admin'])(req, res, next);
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth: AuthHandler = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
}; 