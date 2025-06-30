import { Router } from 'express';
import { 
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserStatistics
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userQuerySchema,
  objectIdParamSchema
} from '../validations/userValidation';

const router = Router();

// User statistics endpoint (must be before /:id routes)
router.get('/statistics', authenticate, getUserStatistics);

// Get all users with filtering and search
router.get('/', authenticate, validate({ query: userQuerySchema }), getAllUsers);

// Create new user
router.post('/', authenticate, validate({ body: createUserSchema }), createUser);

// Get user by ID
router.get('/:id', authenticate, validate({ params: objectIdParamSchema }), getUserById);

// Update user information
router.put('/:id', authenticate, validate({ params: objectIdParamSchema, body: updateUserSchema }), updateUser);

// Update user role
router.patch('/:id/role', authenticate, validate({ params: objectIdParamSchema, body: updateUserRoleSchema }), updateUserRole);

// Update user status (activate/deactivate)
router.patch('/:id/status', authenticate, validate({ params: objectIdParamSchema, body: updateUserStatusSchema }), updateUserStatus);

// Delete user (soft delete)
router.delete('/:id', authenticate, validate({ params: objectIdParamSchema }), deleteUser);

export default router;