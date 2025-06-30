import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { AppError } from './errorHandler';

/**
 * Validation middleware factory
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateRequest = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Validation error: ${errorMessages.join(', ')}`, 400);
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

/**
 * Validation middleware for query parameters
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateQuery = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Query validation error: ${errorMessages.join(', ')}`, 400);
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
};

/**
 * Validation middleware for URL parameters
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateParams = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Parameter validation error: ${errorMessages.join(', ')}`, 400);
    }

    // Replace req.params with validated data
    req.params = value;
    next();
  };
};

/**
 * Combined validation middleware
 * @param schemas - Object containing schemas for body, query, and params
 * @returns Express middleware function
 */
export const validate = (schemas: { 
  body?: Schema; 
  query?: Schema; 
  params?: Schema; 
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorMessages = error.details.map(detail => detail.message);
          throw new AppError(`Validation error: ${errorMessages.join(', ')}`, 400);
        }

        req.body = value;
      }

      // Validate query if schema provided
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorMessages = error.details.map(detail => detail.message);
          throw new AppError(`Query validation error: ${errorMessages.join(', ')}`, 400);
        }

        req.query = value;
      }

      // Validate params if schema provided
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorMessages = error.details.map(detail => detail.message);
          throw new AppError(`Parameter validation error: ${errorMessages.join(', ')}`, 400);
        }

        req.params = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 