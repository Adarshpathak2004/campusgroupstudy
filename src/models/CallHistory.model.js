import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null, // null for 1-on-1 calls, set for group calls
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callerName: {
      type: String,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for group calls
    },
    receiverName: {
      type: String,
      default: null, // null for group calls
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    callType: {
      type: String,
      enum: ['video', 'audio'],
      default: 'video',
    },
    status: {
      type: String,
      enum: ['initiating', 'completed', 'rejected', 'missed', 'busy'],
      default: 'completed',
    },
    duration: {
      type: Number, // duration in seconds
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: null,
    },
    recordingDuration: {
      type: Number,
      default: 0,
    },
    recordingSize: {
      type: Number, // size in bytes
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for faster queries
callHistorySchema.index({ callerId: 1, createdAt: -1 });
callHistorySchema.index({ receiverId: 1, createdAt: -1 });
// Note: callId index is already created by unique: true constraint above

const CallHistory = mongoose.model('CallHistory', callHistorySchema);
export default CallHistory;
