import { Types } from 'mongoose';

export interface SearchOptions {
  search?: string;
  filters?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  page?: number;
  limit?: number;
  populate?: string[];
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Build search query for text search
 * @param search - Search term
 * @param searchFields - Fields to search in
 * @returns MongoDB query object
 */
export const buildSearchQuery = (search: string, searchFields: string[]) => {
  if (!search || !searchFields.length) return {};

  const searchRegex = new RegExp(search, 'i');
  const searchConditions = searchFields.map(field => ({
    [field]: searchRegex
  }));

  return {
    $or: searchConditions
  };
};

/**
 * Build filter query from request query parameters
 * @param query - Request query object
 * @param allowedFilters - Array of allowed filter fields
 * @returns MongoDB filter object
 */
export const buildFilterQuery = (query: any, allowedFilters: string[]) => {
  const filters: any = {};

  allowedFilters.forEach(filter => {
    if (query[filter] !== undefined && query[filter] !== '') {
      // Handle special filter types
      if (filter.includes('Date')) {
        // Date range filters
        if (query[`${filter}From`]) {
          filters[filter] = { ...filters[filter], $gte: new Date(query[`${filter}From`]) };
        }
        if (query[`${filter}To`]) {
          filters[filter] = { ...filters[filter], $lte: new Date(query[`${filter}To`]) };
        }
      } else if (filter.includes('Price')) {
        // Price range filters
        if (query[`${filter}Min`]) {
          filters[filter] = { ...filters[filter], $gte: Number(query[`${filter}Min`]) };
        }
        if (query[`${filter}Max`]) {
          filters[filter] = { ...filters[filter], $lte: Number(query[`${filter}Max`]) };
        }
      } else if (Array.isArray(query[filter])) {
        // Array filters (e.g., multiple categories)
        filters[filter] = { $in: query[filter] };
      } else if (query[filter] === 'true' || query[filter] === 'false') {
        // Boolean filters
        filters[filter] = query[filter] === 'true';
      } else if (Types.ObjectId.isValid(query[filter])) {
        // ObjectId filters
        filters[filter] = new Types.ObjectId(query[filter]);
      } else {
        // Regular string/number filters
        filters[filter] = query[filter];
      }
    }
  });

  return filters;
};

/**
 * Build sort query from request query parameters
 * @param query - Request query object
 * @param defaultSort - Default sort object
 * @param allowedSortFields - Array of allowed sort fields
 * @returns MongoDB sort object
 */
export const buildSortQuery = (
  query: any, 
  defaultSort: Record<string, 1 | -1> = { createdAt: -1 },
  allowedSortFields: string[] = []
) => {
  if (!query.sort) return defaultSort;

  const sortFields = query.sort.split(',');
  const sort: Record<string, 1 | -1> = {};

  sortFields.forEach((field: string) => {
    const isDesc = field.startsWith('-');
    const cleanField = isDesc ? field.substring(1) : field;
    
    if (allowedSortFields.length === 0 || allowedSortFields.includes(cleanField)) {
      sort[cleanField] = isDesc ? -1 : 1;
    }
  });

  return Object.keys(sort).length > 0 ? sort : defaultSort;
};

/**
 * Build pagination options
 * @param query - Request query object
 * @param defaultLimit - Default limit per page
 * @param maxLimit - Maximum limit per page
 * @returns Pagination options
 */
export const buildPaginationOptions = (
  query: any,
  defaultLimit: number = 10,
  maxLimit: number = 100
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Create paginated response
 * @param data - Array of data
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 * @returns Paginated result object
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const pages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
};

/**
 * Build aggregation pipeline for advanced search
 * @param options - Search options
 * @param searchFields - Fields to search in
 * @returns Aggregation pipeline
 */
export const buildSearchPipeline = (
  options: SearchOptions,
  searchFields: string[]
) => {
  const pipeline: any[] = [];

  // Build match stage
  const matchStage: any = {};

  // Add search conditions
  if (options.search) {
    const searchConditions = searchFields.map(field => ({
      [field]: new RegExp(options.search!, 'i')
    }));
    matchStage.$or = searchConditions;
  }

  // Add filters
  if (options.filters) {
    Object.assign(matchStage, options.filters);
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Add sort stage
  if (options.sort) {
    pipeline.push({ $sort: options.sort });
  }

  // Add pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: options.limit });
  }

  // Add population stages
  if (options.populate) {
    options.populate.forEach(populatePath => {
      pipeline.push({
        $lookup: {
          from: populatePath,
          localField: populatePath,
          foreignField: '_id',
          as: populatePath
        }
      });
      pipeline.push({
        $unwind: {
          path: `$${populatePath}`,
          preserveNullAndEmptyArrays: true
        }
      });
    });
  }

  return pipeline;
};

/**
 * Sanitize search input
 * @param input - Raw input string
 * @returns Sanitized string
 */
export const sanitizeSearchInput = (input: string): string => {
  if (!input) return '';
  
  // Remove special characters that could cause regex issues
  return input
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .trim()
    .substring(0, 100); // Limit length
};

/**
 * Build text search index fields for MongoDB
 * @param fields - Array of field names
 * @returns Text search index object
 */
export const buildTextIndex = (fields: string[]) => {
  const index: Record<string, string> = {};
  
  fields.forEach(field => {
    index[field] = 'text';
  });
  
  return index;
}; 