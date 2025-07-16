import Joi from 'joi';

/**
 * Validation schema for creating a service/property
 */
export const serviceSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Property name must be at least 2 characters long',
      'string.max': 'Property name cannot exceed 100 characters',
      'any.required': 'Property name is required'
    }),
  
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
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
      'any.required': 'Price per night is required'
    }),

  // Enhanced hospitality fields
  propertyType: Joi.string()
    .valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other')
    .optional()
    .messages({
      'any.only': 'Property type must be one of: apartment, house, condo, villa, studio, loft, other'
    }),

  bedrooms: Joi.number()
    .min(0)
    .max(20)
    .optional()
    .messages({
      'number.min': 'Bedrooms cannot be negative',
      'number.max': 'Maximum 20 bedrooms allowed'
    }),

  bathrooms: Joi.number()
    .min(0)
    .max(20)
    .optional()
    .messages({
      'number.min': 'Bathrooms cannot be negative',
      'number.max': 'Maximum 20 bathrooms allowed'
    }),

  maxGuests: Joi.number()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.min': 'Must accommodate at least 1 guest',
      'number.max': 'Maximum 50 guests allowed'
    }),

  amenities: Joi.array()
    .items(Joi.string().trim().max(100))
    .max(50)
    .optional()
    .messages({
      'array.max': 'Maximum 50 amenities allowed',
      'string.max': 'Each amenity cannot exceed 100 characters'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 images allowed',
      'string.uri': 'Each image must be a valid URL'
    }),

  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional()
  }).optional(),

  unavailableDates: Joi.array()
    .items(Joi.date())
    .optional()
    .messages({
      'date.base': 'Each unavailable date must be a valid date'
    }),

  // Inventory management fields
  inventory: Joi.object({
    totalUnits: Joi.number()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        'number.min': 'Total units must be at least 1',
        'number.max': 'Maximum 100 units allowed'
      }),
    availableUnits: Joi.number()
      .min(0)
      .max(100)
      .default(1)
      .messages({
        'number.min': 'Available units cannot be negative',
        'number.max': 'Maximum 100 units allowed'
      }),
    minBookingDays: Joi.number()
      .min(1)
      .max(365)
      .default(1)
      .messages({
        'number.min': 'Minimum booking days must be at least 1',
        'number.max': 'Maximum 365 days allowed'
      }),
    maxBookingDays: Joi.number()
      .min(1)
      .max(365)
      .default(30)
      .messages({
        'number.min': 'Maximum booking days must be at least 1',
        'number.max': 'Maximum 365 days allowed'
      })
  }).optional(),

  isActive: Joi.boolean()
    .optional()
    .default(true)
});

/**
 * Validation schema for updating a service/property
 */
export const serviceUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Property name must be at least 2 characters long',
      'string.max': 'Property name cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
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
    }),

  // Enhanced hospitality fields
  propertyType: Joi.string()
    .valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other')
    .optional()
    .messages({
      'any.only': 'Property type must be one of: apartment, house, condo, villa, studio, loft, other'
    }),

  bedrooms: Joi.number()
    .min(0)
    .max(20)
    .optional()
    .messages({
      'number.min': 'Bedrooms cannot be negative',
      'number.max': 'Maximum 20 bedrooms allowed'
    }),

  bathrooms: Joi.number()
    .min(0)
    .max(20)
    .optional()
    .messages({
      'number.min': 'Bathrooms cannot be negative',
      'number.max': 'Maximum 20 bathrooms allowed'
    }),

  maxGuests: Joi.number()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.min': 'Must accommodate at least 1 guest',
      'number.max': 'Maximum 50 guests allowed'
    }),

  amenities: Joi.array()
    .items(Joi.string().trim().max(100))
    .max(50)
    .optional()
    .messages({
      'array.max': 'Maximum 50 amenities allowed',
      'string.max': 'Each amenity cannot exceed 100 characters'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 images allowed',
      'string.uri': 'Each image must be a valid URL'
    }),

  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional()
  }).optional(),

  unavailableDates: Joi.array()
    .items(Joi.date())
    .optional()
    .messages({
      'date.base': 'Each unavailable date must be a valid date'
    }),

  // Inventory management fields
  inventory: Joi.object({
    totalUnits: Joi.number()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Total units must be at least 1',
        'number.max': 'Maximum 100 units allowed'
      }),
    availableUnits: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Available units cannot be negative',
        'number.max': 'Maximum 100 units allowed'
      }),
    minBookingDays: Joi.number()
      .min(1)
      .max(365)
      .optional()
      .messages({
        'number.min': 'Minimum booking days must be at least 1',
        'number.max': 'Maximum 365 days allowed'
      }),
    maxBookingDays: Joi.number()
      .min(1)
      .max(365)
      .optional()
      .messages({
        'number.min': 'Maximum booking days must be at least 1',
        'number.max': 'Maximum 365 days allowed'
      })
  }).optional(),

  isActive: Joi.boolean()
    .optional()
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

  propertyType: Joi.string()
    .valid('apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other')
    .optional(),

  minPrice: Joi.number()
    .min(0)
    .optional(),

  maxPrice: Joi.number()
    .min(0)
    .optional(),

  bedrooms: Joi.number()
    .min(0)
    .optional(),

  bathrooms: Joi.number()
    .min(0)
    .optional(),

  maxGuests: Joi.number()
    .min(1)
    .optional(),

  city: Joi.string()
    .max(100)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
  
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
    }),

  search: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 200 characters'
    }),

  sort: Joi.string()
    .valid('name', 'price', 'createdAt', 'updatedAt', 'bedrooms', 'bathrooms', 'maxGuests')
    .optional(),

  order: Joi.string()
    .valid('asc', 'desc')
    .optional()
});

/**
 * Validation schema for blocking dates
 */
export const blockDatesSchema = Joi.object({
  dates: Joi.array()
    .items(Joi.date().iso())
    .min(1)
    .max(365)
    .required()
    .messages({
      'array.min': 'At least one date is required',
      'array.max': 'Cannot block more than 365 dates at once',
      'date.format': 'Dates must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Dates array is required'
    }),
  
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    })
});

/**
 * Validation schema for unblocking dates
 */
export const unblockDatesSchema = Joi.object({
  dates: Joi.array()
    .items(Joi.date().iso())
    .min(1)
    .max(365)
    .required()
    .messages({
      'array.min': 'At least one date is required',
      'array.max': 'Cannot unblock more than 365 dates at once',
      'date.format': 'Dates must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Dates array is required'
    })
});

/**
 * Validation schema for calendar query parameters
 */
export const calendarQuerySchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date'
    }),
  
  month: Joi.number()
    .min(1)
    .max(12)
    .optional()
    .messages({
      'number.min': 'Month must be between 1 and 12',
      'number.max': 'Month must be between 1 and 12'
    }),
  
  year: Joi.number()
    .min(2020)
    .max(2030)
    .optional()
    .messages({
      'number.min': 'Year must be between 2020 and 2030',
      'number.max': 'Year must be between 2020 and 2030'
    })
});

/**
 * Validation schema for availability check query parameters
 */
export const availabilityQuerySchema = Joi.object({
  checkInDate: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.format': 'Check-in date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Check-in date cannot be in the past',
      'any.required': 'Check-in date is required'
    }),
  
  checkOutDate: Joi.date()
    .iso()
    .min(Joi.ref('checkInDate'))
    .required()
    .messages({
      'date.format': 'Check-out date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    })
});

// Image management validation schemas
export const reorderImagesSchema = Joi.object({
  imageUrls: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.base': 'Image URLs must be an array',
      'array.min': 'At least one image URL is required',
      'array.max': 'Maximum 20 images allowed',
      'string.uri': 'Each image URL must be a valid URL'
    })
});

export const setPrimaryImageSchema = Joi.object({
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.base': 'Image URL must be a string',
      'string.uri': 'Image URL must be a valid URL',
      'any.required': 'Image URL is required'
    })
}); 

/**
 * Validation schema for inventory management
 */
export const inventoryUpdateSchema = Joi.object({
  totalUnits: Joi.number()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.min': 'Total units must be at least 1',
      'number.max': 'Maximum 100 units allowed',
      'any.required': 'Total units is required'
    }),
  availableUnits: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.min': 'Available units cannot be negative',
      'number.max': 'Maximum 100 units allowed',
      'any.required': 'Available units is required'
    }),
  minBookingDays: Joi.number()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.min': 'Minimum booking days must be at least 1',
      'number.max': 'Maximum 365 days allowed',
      'any.required': 'Minimum booking days is required'
    }),
  maxBookingDays: Joi.number()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.min': 'Maximum booking days must be at least 1',
      'number.max': 'Maximum 365 days allowed',
      'any.required': 'Maximum booking days is required'
    })
}).custom((value, helpers) => {
  // Custom validation: availableUnits cannot exceed totalUnits
  if (value.availableUnits > value.totalUnits) {
    return helpers.error('any.invalid', { 
      message: 'Available units cannot exceed total units' 
    });
  }
  
  // Custom validation: minBookingDays cannot exceed maxBookingDays
  if (value.minBookingDays > value.maxBookingDays) {
    return helpers.error('any.invalid', { 
      message: 'Minimum booking days cannot exceed maximum booking days' 
    });
  }
  
  return value;
});

/**
 * Validation schema for inventory adjustment
 */
export const inventoryAdjustmentSchema = Joi.object({
  adjustment: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Adjustment must be a number',
      'number.integer': 'Adjustment must be a whole number',
      'any.required': 'Adjustment amount is required'
    }),
  reason: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 200 characters'
    })
});

/**
 * Validation schema for inventory availability check
 */
export const inventoryAvailabilitySchema = Joi.object({
  startDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.greater': 'Start date must be in the future',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),
  units: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(1)
    .messages({
      'number.base': 'Units must be a number',
      'number.integer': 'Units must be a whole number',
      'number.min': 'At least 1 unit required',
      'number.max': 'Maximum 100 units allowed'
    })
}); 