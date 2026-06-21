const express = require('express');
const router = express.Router();
const { createSettlement, getSettlements } = require('../controllers/settlements.controller');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.post('/:groupId/settlements', createSettlement);
router.get('/:groupId/settlements', getSettlements);

module.exports = router;
