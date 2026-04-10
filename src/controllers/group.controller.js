import Group from '../models/Group.model.js';
import User from '../models/User.model.js';

// @desc    Create a new group
// @route   POST /api/groups
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, subject, isPrivate, maxMembers } = req.body;

    const group = await Group.create({
      name,
      description,
      subject,
      isPrivate,
      maxMembers,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });

    await group.populate('creator', 'name email avatar');
    res.status(201).json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public groups
// @route   GET /api/groups
export const getAllGroups = async (req, res, next) => {
  try {
    const { search, subject } = req.query;
    const filter = { isPrivate: false };

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };

    const groups = await Group.find(filter)
      .populate('creator', 'name avatar')
      .select('-files')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group by ID
// @route   GET /api/groups/:id
export const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name avatar email')
      .populate('members.user', 'name avatar email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a group
// @route   POST /api/groups/:id/join
export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();

    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });

    res.json({ success: true, message: 'Joined group successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a group
// @route   POST /api/groups/:id/leave
export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await group.save();

    await User.findByIdAndUpdate(req.user._id, { $pull: { groups: group._id } });

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's groups
// @route   GET /api/groups/my
export const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
    })
      .populate('creator', 'name avatar')
      .select('-files');

    res.json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group (creator or admin only)
// @route   DELETE /api/groups/:id
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isCreator = group.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await group.deleteOne();
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};
