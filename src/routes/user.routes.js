import express from 'express';
import { getUserById, updateProfile, changePassword } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // all routes below require authentication

router.get('/:id', getUserById);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;
