const Group = require('../models/Group');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      members: [req.user.id],
      createdBy: req.user.id,
    });

    await group.populate('members', 'name email avatar');
    await group.populate('createdBy', 'name email avatar');
    res.status(201).json(group);
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ message: 'Failed to create group.' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups.' });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch group.' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const newMember = await User.findOne({ email: email.toLowerCase().trim() });
    if (!newMember) return res.status(404).json({ message: 'No user found with that email.' });

    if (group.members.some((m) => m.toString() === newMember._id.toString()))
      return res.status(409).json({ message: 'User is already a member.' });

    group.members.push(newMember._id);
    await group.save();
    await group.populate('members', 'name email avatar');
    await group.populate('createdBy', 'name email avatar');

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member.' });
  }
};
