import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateRequest, validateParams } from "../middleware/validation";
import {
  categorySchema,
  categoryUpdateSchema,
  categoryIdSchema,
} from "../validations/categoryValidation";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get("/", getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get("/:id", validateParams(categoryIdSchema), getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest(categorySchema),
  createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validateParams(categoryIdSchema),
  validateRequest(categoryUpdateSchema),
  updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validateParams(categoryIdSchema),
  deleteCategory
);

export default router;
