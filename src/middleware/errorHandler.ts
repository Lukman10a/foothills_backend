import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/environment';
import { AppError, ApiResponse } from '../types';

// Custom error class
class AppErrorClass extends Error implements AppError {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response formatter
const formatErrorResponse = (err: any, req: Request): ApiResponse => {
  const errorResponse: ApiResponse = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  if (isDevelopment) {
    (errorResponse as any).stack = err.stack;
    (errorResponse as any).path = req.originalUrl;
    (errorResponse as any).method = req.method;
  }

  // Add validation errors if present
  if (err.name === 'ValidationError') {
    errorResponse.errors = Object.values(err.errors).map((e: any) => e.message);
  }

  // Add JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
  }

  return errorResponse;
};

// Global error handler middleware
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppErrorClass(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppErrorClass(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new AppErrorClass(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppErrorClass('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppErrorClass('Token expired', 401);
  }

  // Rate limit error
  if (err.type === 'entity.too.large') {
    error = new AppErrorClass('Request entity too large', 413);
  }

  const statusCode = error.statusCode || 500;
  const errorResponse = formatErrorResponse(error, req);

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppErrorClass(`Endpoint not found - ${req.originalUrl}`, 404);
  next(error);
};

export {
  AppErrorClass as AppError,
  errorHandler,
  asyncHandler,
  notFound
}; 