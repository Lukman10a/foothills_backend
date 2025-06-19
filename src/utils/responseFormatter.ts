import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Format successful response
 * @param data - Response data
 * @param message - Success message
 * @param _statusCode - HTTP status code (default: 200)
 * @returns Formatted response
 */
const successResponse = <T = any>(data: T | null = null, message: string = 'Success', _statusCode: number = 200): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Format error response
 * @param message - Error message
 * @param _statusCode - HTTP status code (default: 400)
 * @param errors - Additional error details
 * @returns Formatted error response
 */
const errorResponse = (message: string = 'Error occurred', _statusCode: number = 400, errors: string[] | null = null): ApiResponse => {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Format paginated response
 * @param data - Response data
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total items
 * @param message - Success message
 * @returns Formatted paginated response
 */
const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully'
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Format list response with metadata
 * @param data - Response data
 * @param message - Success message
 * @param metadata - Additional metadata
 * @returns Formatted list response
 */
const listResponse = <T>(
  data: T[],
  message: string = 'Data retrieved successfully',
  metadata: Record<string, any> = {}
): ApiResponse<T[]> & { count: number } => {
  return {
    success: true,
    message,
    data,
    count: data.length,
    ...metadata,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format single item response
 * @param data - Response data
 * @param message - Success message
 * @returns Formatted single item response
 */
const singleResponse = <T>(data: T, message: string = 'Data retrieved successfully'): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format created response
 * @param data - Created data
 * @param message - Success message
 * @returns Formatted created response
 */
const createdResponse = <T>(data: T, message: string = 'Resource created successfully'): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format updated response
 * @param data - Updated data
 * @param message - Success message
 * @returns Formatted updated response
 */
const updatedResponse = <T>(data: T, message: string = 'Resource updated successfully'): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format deleted response
 * @param message - Success message
 * @returns Formatted deleted response
 */
const deletedResponse = (message: string = 'Resource deleted successfully'): ApiResponse => {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
};

export {
  successResponse,
  errorResponse,
  paginatedResponse,
  listResponse,
  singleResponse,
  createdResponse,
  updatedResponse,
  deletedResponse
}; 