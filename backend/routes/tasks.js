const express = require('express');
const { body } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post(
  '/',
  [
    body('title').notEmpty().trim().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createTask
);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
