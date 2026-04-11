import mongoose from 'mongoose';

const callRecordingSchema = new mongoose.Schema(
  {
    callHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallHistory',
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    callId: {
      type: String,
      required: true,
    },
    recordingId: {
      type: String,
      unique: true,
      required: true,
    },
    recordedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Cloudinary Storage
    cloudinaryUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    uploadStatus: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending',
    },
    uploadError: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: 'video/webm',
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true, // accessible to all group members
    },
    metadata: {
      width: Number,
      height: Number,
      bitrate: String,
      tags: [String],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
  { timestamps: true }
);

// Auto-expire recordings
callRecordingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CallRecording = mongoose.model('CallRecording', callRecordingSchema);
export default CallRecording;
