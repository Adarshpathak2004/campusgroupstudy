import User from '../models/User.model.js';
import Group from '../models/Group.model.js';
import Message from '../models/Message.model.js';
import Session from '../models/Session.model.js';

// @desc    Get platform stats
// @route   GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalGroups, totalMessages, totalSessions] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Message.countDocuments({ isDeleted: false }),
      Session.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalGroups, totalMessages, totalSessions },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (ban/unban)
// @route   PATCH /api/admin/users/:id/toggle
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups (admin view)
// @route   GET /api/admin/groups
export const getAllGroupsAdmin = async (req, res, next) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any group
// @route   DELETE /api/admin/groups/:id
export const deleteGroupAdmin = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ success: true, message: 'Group deleted by admin' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent messages across all groups
// @route   GET /api/admin/messages
export const getRecentMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ isDeleted: false })
      .populate('sender', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any message
// @route   DELETE /api/admin/messages/:id
export const deleteMessageAdmin = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.isDeleted = true;
    message.content = '[Removed by admin]';
    await message.save();

    res.json({ success: true, message: 'Message removed' });
  } catch (error) {
    next(error);
  }
};
