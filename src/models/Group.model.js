import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    files: [
      {
        name: String,
        url: String,
        publicId: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    maxMembers: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

// Virtual for member count
groupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

const Group = mongoose.model('Group', groupSchema);
export default Group;
