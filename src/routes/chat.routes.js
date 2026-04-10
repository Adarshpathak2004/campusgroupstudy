import express from 'express';
import { getGroupMessages, deleteMessage } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/:groupId', getGroupMessages);
router.delete('/:messageId', deleteMessage);

export default router;
