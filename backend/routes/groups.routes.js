const express = require('express');
const router = express.Router();
const { createGroup, getGroups, getGroup, addMember } = require('../controllers/groups.controller');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/:id/members', addMember);

module.exports = router;
