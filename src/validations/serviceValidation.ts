import Joi from 'joi';

/**
 * Validation schema for creating a service
 */
export const serviceSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Service name must be at least 2 characters long',
      'string.max': 'Service name cannot exceed 100 characters',
      'any.required': 'Service name is required'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid category ID format',
      'any.required': 'Category is required'
    }),
  
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Price must be a positive number',
      'any.required': 'Price is required'
    })
});

/**
 * Validation schema for updating a service
 */
export const serviceUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Service name must be at least 2 characters long',
      'string.max': 'Service name cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid category ID format'
    }),
  
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Price must be a positive number'
    })
});

/**
 * Validation schema for service ID parameter
 */
export const serviceIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid service ID format',
      'any.required': 'Service ID is required'
    })
});

/**
 * Validation schema for service query parameters
 */
export const serviceQuerySchema = Joi.object({
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid category ID format'
    }),
  
  provider: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid provider ID format'
    }),
  
  page: Joi.number()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
}); 