import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse, createdResponse } from '../utils/responseFormatter';
import Category from '../models/Category';
import Service from '../models/Service';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all categories
 * GET /api/categories
 */
export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: { $ne: false } }).sort({ name: 1 });
  
  res.status(200).json(successResponse(categories, 'Categories retrieved successfully'));
});

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params['id']);
  
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  
  res.status(200).json(successResponse(category, 'Category retrieved successfully'));
});

/**
 * Create new category
 * POST /api/categories
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ name, isActive: { $ne: false } });
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }
  
  const category = await Category.create({
    name,
    description,
    isActive: true
  });
  
  res.status(201).json(createdResponse(category, 'Category created successfully'));
});

/**
 * Update category
 * PUT /api/categories/:id
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, isActive } = req.body;
  
  // Check if category exists
  const category = await Category.findById(req.params['id']);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  
  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ 
      name, 
      _id: { $ne: req.params['id'] },
      isActive: { $ne: false }
    });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }
  }
  
  // Update category
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params['id'],
    { name, description, isActive },
    { new: true, runValidators: true }
  );
  
  res.status(200).json(successResponse(updatedCategory, 'Category updated successfully'));
});

/**
 * Delete category (soft delete)
 * DELETE /api/categories/:id
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params['id']);
  
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  
  // Check if category is being used by any active services
  const servicesUsingCategory = await Service.find({ 
    category: req.params['id'],
    isActive: { $ne: false }
  });
  
  if (servicesUsingCategory.length > 0) {
    throw new AppError(
      `Cannot delete category that has ${servicesUsingCategory.length} associated service(s). Please deactivate or reassign services first.`, 
      400
    );
  }
  
  // Soft delete by setting isActive to false
  await Category.findByIdAndUpdate(req.params['id'], { isActive: false });
  
  res.status(200).json(successResponse(null, 'Category deleted successfully'));
}); 