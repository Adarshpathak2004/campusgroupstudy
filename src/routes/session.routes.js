import express from 'express';
import {
  createSession,
  getGroupSessions,
  getMySessions,
  updateSessionStatus,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createSession);
router.get('/my', getMySessions);
router.get('/group/:groupId', getGroupSessions);
router.patch('/:id/status', updateSessionStatus);

export default router;
