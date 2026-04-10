import Session from '../models/Session.model.js';
import Group from '../models/Group.model.js';
import mongoose from 'mongoose';

// @desc    Create a study session
// @route   POST /api/sessions
export const createSession = async (req, res, next) => {
  try {
    const { title, description, groupId, startTime, endTime, location, meetingLink } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid groupId. Provide a valid Group _id.' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const session = await Session.create({
      title,
      description,
      group: groupId,
      scheduledBy: req.user._id,
      startTime,
      endTime,
      location,
      meetingLink,
    });

    await session.populate(['scheduledBy', 'group']);
    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sessions for a group
// @route   GET /api/sessions/group/:groupId
export const getGroupSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ group: req.params.groupId })
      .populate('scheduledBy', 'name avatar')
      .sort({ startTime: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all upcoming sessions for current user
// @route   GET /api/sessions/my
export const getMySessions = async (req, res, next) => {
  try {
    const userGroups = req.user.groups;
    const sessions = await Session.find({
      group: { $in: userGroups },
      startTime: { $gte: new Date() },
      status: 'upcoming',
    })
      .populate('group', 'name')
      .populate('scheduledBy', 'name')
      .sort({ startTime: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session status
// @route   PATCH /api/sessions/:id/status
export const updateSessionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};
