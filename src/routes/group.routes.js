import express from 'express';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getMyGroups,
  deleteGroup,
} from '../controllers/group.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllGroups);
router.post('/', createGroup);
router.get('/my', getMyGroups);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);

export default router;
