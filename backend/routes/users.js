const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, getMembers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/members', getMembers);
router.get('/', adminOnly, getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
