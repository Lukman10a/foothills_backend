import Joi from 'joi';

/**
 * Validation schema for creating a new user (Admin only)
 */
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  role: Joi.string()
    .valid('customer', 'provider', 'admin')
    .default('customer')
    .messages({
      'any.only': 'Role must be one of: customer, provider, admin'
    }),
  
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

/**
 * Validation schema for updating user information (Admin only)
 */
export const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  role: Joi.string()
    .valid('customer', 'provider', 'admin')
    .messages({
      'any.only': 'Role must be one of: customer, provider, admin'
    }),
  
  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for updating user role (Admin only)
 */
export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid('customer', 'provider', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be one of: customer, provider, admin',
      'any.required': 'Role is required'
    })
});

/**
 * Validation schema for updating user status (Admin only)
 */
export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
      'any.required': 'isActive is required'
    })
});

/**
 * Validation schema for user query parameters
 */
export const userQuerySchema = Joi.object({
  // Search and pagination
  search: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Search term must be at least 1 character long',
      'string.max': 'Search term cannot exceed 100 characters'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  // Sorting
  sort: Joi.string()
    .valid('firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt')
    .default('createdAt')
    .messages({
      'any.only': 'Sort field must be one of: firstName, lastName, email, role, createdAt, updatedAt'
    }),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Order must be either asc or desc'
    }),
  
  // Filtering
  role: Joi.string()
    .valid('customer', 'provider', 'admin')
    .messages({
      'any.only': 'Role filter must be one of: customer, provider, admin'
    }),
  
  isActive: Joi.string()
    .valid('true', 'false')
    .messages({
      'any.only': 'isActive filter must be either true or false'
    }),
  
  // Date range filtering
  startDate: Joi.date()
    .iso()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date'
    })
});

/**
 * Validation schema for MongoDB ObjectId parameters
 */
export const objectIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});