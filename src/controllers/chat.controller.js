import Message from '../models/Message.model.js';
import Group from '../models/Group.model.js';

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId
export const getGroupMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: groupId, isDeleted: false })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Return in ascending order for chat display
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (admin or sender)
// @route   DELETE /api/chat/:messageId
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSender && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};
