// const express = require('express');
// const router = express.Router();
// const ctrl = require('../controllers/classController');

// router.get('/', ctrl.getClasses);
// router.get('/:id', ctrl.getClass);
// router.post('/', ctrl.createClass);
// router.put('/:id', ctrl.updateClass);
// router.delete('/:id', ctrl.deleteClass);

// module.exports = router;

const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/classController');

const router = express.Router();

router.get('/', ctrl.getClasses);

router.post('/', validate([
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('section').optional().trim().escape(),
  body('year').optional().trim().escape(),
  body('classTeacher').optional().isMongoId().withMessage('Invalid teacher ID'),
  body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be between 1 and 500'),
  body('room').optional().trim().escape(),
  body('fee').optional().isInt({ min: 0 })
]), ctrl.createClass);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid class ID')
]), ctrl.getClass);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid class ID'),
  body('name').optional().trim().notEmpty().withMessage('Class name cannot be empty'),
  body('section').optional().trim().escape(),
  body('year').optional().trim().escape(),
  body('classTeacher').optional().isMongoId().withMessage('Invalid teacher ID'),
  body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be between 1 and 500'),
  body('room').optional().trim().escape(),
  body('fee').optional().isInt({ min: 0 })
]), ctrl.updateClass);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid class ID')
]), ctrl.deleteClass);

module.exports = router;