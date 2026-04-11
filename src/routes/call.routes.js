import express from 'express';
import multer from 'multer';
import * as callController from '../controllers/call.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Multer config for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video or audio files are allowed'));
    }
  },
});

// ========================= USERS & CALLS =========================

// Get all online users
router.get('/online-users', protect, callController.getOnlineUsers);

// Get specific user details for call
router.get('/user/:userId', protect, callController.getUserForCall);

// ========================= CALL HISTORY =========================

// Log a call to history
router.post('/history/log', protect, callController.logCallHistory);

// Get call history for current user
router.get('/history', protect, callController.getCallHistory);

// Get call history with specific user
router.get('/history/:userId', protect, callController.getCallHistoryWithUser);

// Delete call history record
router.delete('/history/:callHistoryId', protect, callController.deleteCallHistory);

// ========================= CALL RECORDING =========================

// Save recording metadata
router.post('/recording/metadata', protect, callController.saveRecordingMetadata);

// Upload recording to Cloudinary
router.post(
  '/recording/upload',
  protect,
  upload.single('recording'),
  callController.uploadRecordingToCloud
);

// Upload standalone recording (without call history)
router.post(
  '/recording/upload-standalone',
  protect,
  upload.single('recording'),
  callController.uploadStandaloneRecording
);

// Get recordings for a specific call
router.get('/recording/:callHistoryId', protect, callController.getCallRecordings);

// Get all recordings for a group
router.get('/group/:groupId/recordings', protect, callController.getGroupRecordings);

// Increment download count
router.put('/recording/:recordingId/download', protect, callController.incrementRecordingDownloads);

// Delete a recording
router.delete('/recording/:recordingId', protect, callController.deleteRecording);

export default router;
