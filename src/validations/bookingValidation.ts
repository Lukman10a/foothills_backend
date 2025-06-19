import Joi from 'joi';

/**
 * Validation schema for creating a booking
 */
export const bookingSchema = Joi.object({
  service: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid service ID format',
      'any.required': 'Service is required'
    }),
  
  date: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Booking date must be in the future',
      'any.required': 'Booking date is required'
    }),
  
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

/**
 * Validation schema for updating a booking
 */
export const bookingUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, cancelled, completed'
    }),
  
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

/**
 * Validation schema for booking ID parameter
 */
export const bookingIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid booking ID format',
      'any.required': 'Booking ID is required'
    })
});

/**
 * Validation schema for booking query parameters
 */
export const bookingQuerySchema = Joi.object({
  user: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid user ID format'
    }),
  
  service: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid service ID format'
    }),
  
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, cancelled, completed'
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