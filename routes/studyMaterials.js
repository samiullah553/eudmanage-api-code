const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { listMaterials, createMaterial, getMaterialById, updateMaterial, deleteMaterial } = require('../controllers/studyMaterialController');

const router = express.Router();

router.get('/', validate([
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('q').optional().trim().escape(),
  query('subjectId').optional().isMongoId(),
  query('classId').optional().isMongoId()
]), listMaterials);

router.post('/', validate([
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subjectId').optional().isMongoId(),
  body('classId').optional().isMongoId(),
  body('notes').optional().trim(),
  body('resources').optional().isArray()
]), createMaterial);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid material ID')
]), getMaterialById);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid material ID'),
  body('title').optional().trim().notEmpty(),
  body('notes').optional().trim(),
  body('resources').optional().isArray()
]), updateMaterial);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid material ID')
]), deleteMaterial);

module.exports = router;
