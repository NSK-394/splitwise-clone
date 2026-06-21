const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');
const calculateBalances = require('../utils/calculateBalances');
const simplifyDebts = require('../utils/simplifyDebts');

function buildSplits(splitType, amount, participants, percentages, exactAmounts) {
  if (splitType === 'equal') {
    const share = Math.round((amount / participants.length) * 100) / 100;
    const splits = participants.map((uid) => ({ user: uid, amount: share }));
    // distribute rounding remainder to first participant
    const total = splits.reduce((s, x) => s + x.amount, 0);
    const diff = Math.round((amount - total) * 100) / 100;
    if (diff !== 0) splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    return splits;
  }

  if (splitType === 'percentage') {
    const total = percentages.reduce((s, p) => s + p, 0);
    if (Math.abs(total - 100) > 0.01)
      throw new Error('Percentages must add up to 100.');
    return participants.map((uid, i) => ({
      user: uid,
      amount: Math.round(amount * (percentages[i] / 100) * 100) / 100,
    }));
  }

  if (splitType === 'exact') {
    const total = exactAmounts.reduce((s, a) => s + a, 0);
    if (Math.abs(total - amount) > 0.01)
      throw new Error(`Exact amounts must add up to ${amount}.`);
    return participants.map((uid, i) => ({ user: uid, amount: exactAmounts[i] }));
  }

  throw new Error('Invalid split type.');
}

exports.addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paidBy, splitType = 'equal', participants, percentages, exactAmounts, category } = req.body;

    if (!description || !amount || !paidBy || !participants?.length)
      return res.status(400).json({ message: 'description, amount, paidBy and participants are required.' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const splits = buildSplits(splitType, Number(amount), participants, percentages, exactAmounts);

    const expense = await Expense.create({
      description: description.trim(),
      amount: Number(amount),
      group: groupId,
      paidBy,
      splitType,
      splits,
      category: category || 'general',
      createdBy: req.user.id,
    });

    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('createdBy', 'name email avatar');
    await expense.populate('splits.user', 'name email avatar');

    res.status(201).json(expense);
  } catch (err) {
    if (err.message.includes('must add up') || err.message === 'Invalid split type.')
      return res.status(400).json({ message: err.message });
    console.error('addExpense error:', err);
    res.status(500).json({ message: 'Failed to add expense.' });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses.' });
  }
};

exports.getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'name email avatar');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', '_id')
      .populate('splits.user', '_id');
    const settlements = await Settlement.find({ group: groupId });

    const balanceMap = calculateBalances(expenses, settlements, group.members);

    const result = group.members.map((m) => ({
      user: m,
      balance: Math.round((balanceMap[m._id.toString()] || 0) * 100) / 100,
    }));

    res.json(result);
  } catch (err) {
    console.error('getBalances error:', err);
    res.status(500).json({ message: 'Failed to calculate balances.' });
  }
};

exports.getSimplifiedDebts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'name email avatar');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group.' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', '_id')
      .populate('splits.user', '_id');
    const settlements = await Settlement.find({ group: groupId });

    const balanceMap = calculateBalances(expenses, settlements, group.members);
    const transactions = simplifyDebts(balanceMap);

    const memberMap = {};
    group.members.forEach((m) => { memberMap[m._id.toString()] = m; });

    const result = transactions.map((t) => ({
      from: memberMap[t.from],
      to: memberMap[t.to],
      amount: t.amount,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to simplify debts.' });
  }
};
