import User from '../models/User.model.js';
import CallHistory from '../models/CallHistory.model.js';
import CallRecording from '../models/CallRecording.model.js';
import Group from '../models/Group.model.js';
import { v2 as cloudinary } from 'cloudinary';

// Get all online users
export const getOnlineUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all active users (this is a basic implementation)
    // In production, you'd get this from your socket manager
    const users = await User.find({ isActive: true, _id: { $ne: currentUserId } })
      .select('_id name avatar')
      .limit(50);
    
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users',
      error: error.message,
    });
  }
};

// Get user details for call
export const getUserForCall = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('_id name avatar email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message,
    });
  }
};

// ========================= CALL HISTORY =========================

// Log call to history
export const logCallHistory = async (req, res) => {
  try {
    const { callId, callerId, callerName, receiverId, receiverName, duration, callType, status, groupId, isGroupCall } = req.body;
    
    // Validate required fields
    if (!callId || !callerId || !callType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: callId, callerId, callType',
      });
    }

    // For group calls, receiverId is not required
    if (!isGroupCall && !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'For 1-on-1 calls, receiverId is required',
      });
    }

    // Prepare call data with proper type handling
    const callData = {
      callId,
      callerId,
      callerName: callerName || 'Unknown',
      receiverId: receiverId || null,
      receiverName: receiverName || 'Unknown',
      callType,
      status: status || 'completed',
      duration: duration || 0,
      groupId: groupId || null,
      isGroupCall: isGroupCall || false,
      startTime: new Date(),
      endTime: new Date(),
    };

    const callHistory = await CallHistory.create(callData);

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: callHistory,
    });
  } catch (error) {
    console.error('❌ Error logging call:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to log call',
      error: error.message,
    });
  }
};

// Get call history for current user
export const getCallHistory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    // Get calls where user is either caller or receiver
    const callHistory = await CallHistory.find({
      $or: [{ callerId: currentUserId }, { receiverId: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('callerId', 'name avatar email')
      .populate('receiverId', 'name avatar email');

    const total = await CallHistory.countDocuments({
      $or: [{ callerId: currentUserId }, { receiverId: currentUserId }],
    });

    res.status(200).json({
      success: true,
      data: callHistory,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message,
    });
  }
};

// Get call history with specific user
export const getCallHistoryWithUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const callHistory = await CallHistory.find({
      $or: [
        { callerId: currentUserId, receiverId: userId },
        { callerId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('callerId', 'name avatar')
      .populate('receiverId', 'name avatar');

    res.status(200).json({
      success: true,
      data: callHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message,
    });
  }
};

// Delete call history
export const deleteCallHistory = async (req, res) => {
  try {
    const { callHistoryId } = req.params;
    const currentUserId = req.user.id;

    // Find call history and verify ownership
    const callHistory = await CallHistory.findById(callHistoryId);

    if (!callHistory) {
      return res.status(404).json({
        success: false,
        message: 'Call history not found',
      });
    }

    // Only caller or receiver can delete
    if (callHistory.callerId.toString() !== currentUserId && callHistory.receiverId.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this record',
      });
    }

    // Delete associated recordings
    await CallRecording.deleteMany({ callHistoryId });

    // Delete call history
    await CallHistory.findByIdAndDelete(callHistoryId);

    res.status(200).json({
      success: true,
      message: 'Call history deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete call history',
      error: error.message,
    });
  }
};

// ========================= CALL RECORDING =========================

// Save recording metadata
export const saveRecordingMetadata = async (req, res) => {
  try {
    const { callHistoryId, callId, recordingId, duration, fileSize, mimeType, groupId } = req.body;
    const currentUserId = req.user.id;

    if (!callId || !recordingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const callRecording = await CallRecording.create({
      callHistoryId,
      callId,
      recordingId,
      recordedById: currentUserId,
      groupId: groupId || null,
      duration: duration || 0,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'video/webm',
      uploadStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Recording metadata saved',
      data: callRecording,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save recording metadata',
      error: error.message,
    });
  }
};

// Upload recording to Cloudinary
export const uploadRecordingToCloud = async (req, res) => {
  try {
    const { recordingId, callHistoryId, groupId, fileName } = req.body;
    const currentUserId = req.user.id;

    if (!req.file || !recordingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing recording file or recordingId',
      });
    }

    // Find the recording
    const recording = await CallRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    // Verify ownership or group membership
    const callHistory = await CallHistory.findById(callHistoryId).populate('groupId');
    if (callHistory.groupId && callHistory.groupId.members) {
      const isMember = callHistory.groupId.members.includes(currentUserId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
        });
      }
    }

    // Upload to Cloudinary
    try {
      recording.uploadStatus = 'uploading';
      await recording.save();

      const uploadStream = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: `call-recordings/${groupId || 'personal'}`,
            public_id: recordingId,
            filename_override: fileName || `call-recording-${recordingId}.webm`,
            tags: [
              'call-recording',
              groupId ? `group-${groupId}` : 'personal',
              `user-${currentUserId}`,
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      // Save Cloudinary details
      recording.cloudinaryUrl = uploadStream.secure_url;
      recording.cloudinaryPublicId = uploadStream.public_id;
      recording.uploadStatus = 'completed';
      recording.fileSize = uploadStream.bytes;
      recording.duration = uploadStream.duration || 0;
      await recording.save();

      res.status(200).json({
        success: true,
        message: 'Recording uploaded successfully',
        data: {
          recordingId: recording._id,
          cloudinaryUrl: recording.cloudinaryUrl,
          uploadStatus: recording.uploadStatus,
          fileName: uploadStream.public_id,
        },
      });
    } catch (uploadError) {
      recording.uploadStatus = 'failed';
      recording.uploadError = uploadError.message;
      await recording.save();

      throw uploadError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload recording',
      error: error.message,
    });
  }
};

// Get group recordings
export const getGroupRecordings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is group member
    const group = await Group.findById(groupId);

    if (!group || !group.members.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access group recordings',
      });
    }

    // Get all recordings for this group
    const recordings = await CallRecording.find({
      groupId,
      uploadStatus: 'completed',
    })
      .populate('recordedById', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: recordings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group recordings',
      error: error.message,
    });
  }
};

// Get recordings for a specific call
export const getCallRecordings = async (req, res) => {
  try {
    const { callHistoryId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is part of the call
    const callHistory = await CallHistory.findById(callHistoryId);

    if (!callHistory) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    if (
      callHistory.callerId.toString() !== currentUserId &&
      callHistory.receiverId.toString() !== currentUserId &&
      !callHistory.participants.includes(currentUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const recordings = await CallRecording.find({
      callHistoryId,
      uploadStatus: 'completed',
    }).populate('recordedById', 'name avatar');

    res.status(200).json({
      success: true,
      data: recordings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings',
      error: error.message,
    });
  }
};

// Increment recording download count
export const incrementRecordingDownloads = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const currentUserId = req.user.id;

    const recording = await CallRecording.findByIdAndUpdate(
      recordingId,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        recordingId: recording._id,
        downloadCount: recording.downloadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update download count',
      error: error.message,
    });
  }
};

// Delete recording from Cloudinary and database
export const deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const currentUserId = req.user.id;

    const recording = await CallRecording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    // Only the user who recorded can delete
    if (recording.recordedById.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this recording',
      });
    }

    // Delete from Cloudinary
    if (recording.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(recording.cloudinaryPublicId, {
          resource_type: 'video',
        });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    await CallRecording.findByIdAndDelete(recordingId);

    res.status(200).json({
      success: true,
      message: 'Recording deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
      error: error.message,
    });
  }
};

// Upload standalone recording (without call history)
export const uploadStandaloneRecording = async (req, res) => {
  try {
    const { groupId, fileName } = req.body;
    const currentUserId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing recording file',
      });
    }

    // Create a recording ID
    const recordingId = `rec-${Date.now()}-${currentUserId}`;

    // Create recording document (without callHistoryId)
    const recording = await CallRecording.create({
      callId: `call-${Date.now()}`,
      recordingId,
      recordedById: currentUserId,
      groupId: groupId || null,
      mimeType: req.file.mimetype,
      uploadStatus: 'uploading',
    });

    // Upload to Cloudinary
    try {
      const uploadStream = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: `recordings/${groupId || 'personal'}`,
            public_id: recordingId,
            filename_override: fileName || `recording-${recordingId}`,
            tags: [
              'standalone-recording',
              groupId ? `group-${groupId}` : 'personal',
              `user-${currentUserId}`,
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      // Save Cloudinary details
      recording.cloudinaryUrl = uploadStream.secure_url;
      recording.cloudinaryPublicId = uploadStream.public_id;
      recording.uploadStatus = 'completed';
      recording.fileSize = uploadStream.bytes;
      recording.duration = uploadStream.duration || 0;
      await recording.save();

      res.status(200).json({
        success: true,
        message: 'Recording uploaded successfully',
        data: {
          recordingId: recording._id,
          cloudinaryUrl: recording.cloudinaryUrl,
          uploadStatus: recording.uploadStatus,
          fileName: uploadStream.public_id,
          duration: recording.duration,
          fileSize: recording.fileSize,
        },
      });
    } catch (uploadError) {
      recording.uploadStatus = 'failed';
      recording.uploadError = uploadError.message;
      await recording.save();

      throw uploadError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload recording',
      error: error.message,
    });
  }
};
