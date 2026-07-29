const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskAttachment
} = require('../controllers/taskController');

router.get('/', validate([ query('classId').optional().isMongoId(), query('type').optional().trim().escape() ]), getTasks);
router.get('/:id', validate([ param('id').isMongoId() ]), getTaskById);

router.post('/', validate([
  body('title').trim().notEmpty().withMessage('title required'),
  body('classId').optional().isMongoId(),
  body('subjectId').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('type').optional().trim().escape()
]), createTask);

router.put('/:id', validate([
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('classId').optional().isMongoId(),
  body('subjectId').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('type').optional().trim().escape()
]), updateTask);

router.delete('/:id', validate([ param('id').isMongoId() ]), deleteTask);
router.post('/:id/attachments', validate([ param('id').isMongoId(), body('title').trim().notEmpty() ]), addTaskAttachment);

module.exports = router;
