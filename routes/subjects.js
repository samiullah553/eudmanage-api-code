// const express = require('express');
// const router = express.Router();
// const { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

// router.get('/', getSubjects);
// router.get('/:id', getSubject);
// router.post('/', createSubject);
// router.put('/:id', updateSubject);
// router.delete('/:id', deleteSubject);

// module.exports = router;

const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

const router = express.Router();

router.get('/', validate([
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 })
]), getSubjects);

router.post('/', validate([
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('teacherId').optional().isMongoId().withMessage('Invalid teacher ID'),
  body('classIds').optional().isArray().custom(arr => arr.every(id => /^[a-f\d]{24}$/i.test(id))).withMessage('Invalid class IDs'),
  body('credits').optional().isInt({ min: 0, max: 10 }).withMessage('Credits must be between 0 and 10'),
  body('dept').optional().trim().escape(),
  body('description').optional().trim().escape()
]), createSubject);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid subject ID')
]), getSubject);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid subject ID'),
  body('name').optional().trim().notEmpty().withMessage('Subject name cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Subject code cannot be empty'),
  body('teacherId').optional().isMongoId().withMessage('Invalid teacher ID'),
  body('classIds').optional().isArray().custom(arr => arr.every(id => /^[a-f\d]{24}$/i.test(id))).withMessage('Invalid class IDs'),
  body('credits').optional().isInt({ min: 0, max: 10 }).withMessage('Credits must be between 0 and 10'),
  body('dept').optional().trim().escape(),
  body('description').optional().trim().escape()
]), updateSubject);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid subject ID')
]), deleteSubject);

module.exports = router;