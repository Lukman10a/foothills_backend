import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongoose';

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  MONGODB_URI_TEST?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;
}

// User types
export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin' | 'provider';
  isActive?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'customer' | 'admin' | 'provider';
  isActive?: boolean;
}

// Service types
export interface IService {
  _id?: ObjectId;
  name: string;
  description?: string;
  category: ObjectId;
  price: number;
  provider: ObjectId;
  // Enhanced hospitality fields
  propertyType?: 'apartment' | 'house' | 'condo' | 'villa' | 'studio' | 'loft' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  images?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  unavailableDates?: Date[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceInput {
  name: string;
  description: string;
  category: string;
  price: number;
  // Enhanced hospitality fields
  propertyType?: 'apartment' | 'house' | 'condo' | 'villa' | 'studio' | 'loft' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  images?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  unavailableDates?: Date[];
  isActive?: boolean;
}

// Booking types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IBooking {
  _id?: ObjectId;
  user: ObjectId;
  service: ObjectId;
  date: Date;
  status: BookingStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBookingInput {
  serviceId: string;
  date: Date;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Category types
export interface ICategory {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryInput {
  name: string;
  description: string;
  isActive?: boolean;
}

// Authentication types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
}

// Middleware types
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export type AuthHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

// Validation types
export interface ValidationResult {
  error?: any;
  value: any;
}

// Database types
export interface DatabaseConfig {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  family?: number;
  bufferCommands?: boolean;
} 