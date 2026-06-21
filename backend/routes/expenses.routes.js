const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, getBalances, getSimplifiedDebts } = require('../controllers/expenses.controller');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.post('/:groupId/expenses', addExpense);
router.get('/:groupId/expenses', getExpenses);
router.get('/:groupId/balances', getBalances);
router.get('/:groupId/simplified-debts', getSimplifiedDebts);

module.exports = router;
