const express = require('express');
const { body } = require('express-validator');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/task/:taskId', getComments);
router.post(
  '/',
  [body('content').notEmpty().trim().withMessage('Content is required'), body('task').notEmpty().withMessage('Task ID required')],
  validate,
  createComment
);
router.put('/:id', [body('content').notEmpty().trim()], validate, updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
