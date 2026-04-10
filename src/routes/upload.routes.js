import express from 'express';
import { uploadGroupFile, getGroupFiles, deleteGroupFile } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect);

router.post('/group/:groupId', upload.single('file'), uploadGroupFile);
router.get('/group/:groupId/files', getGroupFiles);
router.delete('/group/:groupId/files/:fileId', deleteGroupFile);

export default router;
