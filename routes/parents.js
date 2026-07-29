const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { getParents, createParent, updateParent, getParentById, linkParentToStudent, deleteParent, getMyChildren } = require('../controllers/parentController');

const router = express.Router();

router.get('/', validate([
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('q').optional().trim().escape()
]), getParents);

router.post('/', validate([
  body('fname').trim().notEmpty().withMessage('First name is required'),
  body('lname').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('relationship').optional({ checkFalsy: true }).trim().escape(),
  body('isPrimary').optional().isBoolean()
]), createParent);

router.get('/me/children', getMyChildren);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid parent ID')
]), getParentById);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid parent ID'),
  body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email')
]), updateParent);

router.post('/:id/link-student', validate([
  param('id').isMongoId().withMessage('Invalid parent ID'),
  body('parentId').optional().isMongoId().withMessage('Invalid parent ID'),
  body('relationship').optional().trim().escape(),
  body('isPrimary').optional().isBoolean()
]), linkParentToStudent);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid parent ID')
]), deleteParent);

module.exports = router;
