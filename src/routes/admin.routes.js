import express from 'express';
import {
  getStats,
  getAllUsers,
  toggleUserStatus,
  getAllGroupsAdmin,
  deleteGroupAdmin,
  getRecentMessages,
  deleteMessageAdmin,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/groups', getAllGroupsAdmin);
router.delete('/groups/:id', deleteGroupAdmin);
router.get('/messages', getRecentMessages);
router.delete('/messages/:id', deleteMessageAdmin);

export default router;
