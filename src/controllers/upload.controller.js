import Group from '../models/Group.model.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

const normalizeObjectId = (value) => {
  const raw = String(value || '').trim();
  const wrapped = raw.match(/^ObjectId\(['\"]?([a-fA-F0-9]{24})['\"]?\)$/);
  if (wrapped) return wrapped[1];
  return raw.replace(/^['\"]|['\"]$/g, '');
};

// @desc    Upload file to a group
// @route   POST /api/upload/group/:groupId
export const uploadGroupFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const groupId = normalizeObjectId(req.params.groupId);
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid groupId format' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });

    const fileData = {
      name: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      uploadedBy: req.user._id,
    };

    group.files.push(fileData);
    await group.save();

    res.status(201).json({ success: true, file: fileData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all files in a group
// @route   GET /api/upload/group/:groupId/files
export const getGroupFiles = async (req, res, next) => {
  try {
    const groupId = normalizeObjectId(req.params.groupId);
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid groupId format' });
    }

    const group = await Group.findById(groupId).populate(
      'files.uploadedBy',
      'name avatar'
    );
    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({ success: true, files: group.files });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a file from group
// @route   DELETE /api/upload/group/:groupId/files/:fileId
export const deleteGroupFile = async (req, res, next) => {
  try {
    const groupId = normalizeObjectId(req.params.groupId);
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid groupId format' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const file = group.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'auto' });

    group.files.pull(req.params.fileId);
    await group.save();

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
};
