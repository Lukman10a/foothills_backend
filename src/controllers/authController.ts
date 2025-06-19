import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { generateToken } from '../utils/auth';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role = 'customer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role
  });

  // Generate JWT token
  const token = generateToken(user);

  // Return user data and token
  const userData = {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: `${user.firstName} ${user.lastName}`
    },
    token
  };

  res.status(201).json(createdResponse(userData, 'User registered successfully'));
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user by email and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if password is correct
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = generateToken(user);

  // Return user data and token
  const userData = {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: `${user.firstName} ${user.lastName}`
    },
    token
  };

  res.status(200).json(successResponse(userData, 'Login successful'));
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const userData = {
    id: req.user._id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    fullName: `${req.user.firstName} ${req.user.lastName}`,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  };

  res.status(200).json(successResponse(userData, 'Profile retrieved successfully'));
});

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // You could implement a blacklist here if needed
  res.status(200).json(successResponse(null, 'Logged out successfully'));
});

/**
 * Refresh token (optional - for extending sessions)
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Generate new token
  const token = generateToken(req.user);

  const userData = {
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      fullName: `${req.user.firstName} ${req.user.lastName}`
    },
    token
  };

  res.status(200).json(successResponse(userData, 'Token refreshed successfully'));
}); 