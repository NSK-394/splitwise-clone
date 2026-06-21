const Settlement = require('../models/Settlement');
const Group = require('../models/Group');

exports.createSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { to, amount, note } = req.body;

    if (!to || !amount)
      return res.status(400).json({ message: 'to and amount are required.' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    if (req.user.id === to)
      return res.status(400).json({ message: 'Cannot settle with yourself.' });

    const settlement = await Settlement.create({
      group: groupId,
      from: req.user.id,
      to,
      amount: Number(amount),
      note: note?.trim() || '',
    });

    await settlement.populate('from', 'name email avatar');
    await settlement.populate('to', 'name email avatar');

    res.status(201).json(settlement);
  } catch (err) {
    console.error('createSettlement error:', err);
    res.status(500).json({ message: 'Failed to record settlement.' });
  }
};

exports.getSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const settlements = await Settlement.find({ group: groupId })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort({ date: -1 });

    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settlements.' });
  }
};
