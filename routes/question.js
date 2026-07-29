// backend/routes/questions.js
const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const validate = require('../middleware/validate');
const {
	getQuestion,
	getChapters,
	getQuestionById,
	createQuestion,
	bulkCreateQuestions,
	updateQuestion,
	deleteQuestion
} = require('../controllers/questionController');

// ── GET /api/questions/chapters ───────────────────
router.get('/chapters', validate([
	query('classId').isMongoId().withMessage('classId required'),
	query('subjectId').isMongoId().withMessage('subjectId required')
]), getChapters);

// ── GET /api/questions ─────────────────────────────
router.get('/', validate([
	query('classId').optional().isMongoId(),
	query('subjectId').optional().isMongoId(),
	query('chapter').optional().trim().escape(),
	query('type').optional().trim().escape(),
	query('difficulty').optional().trim().escape()
]), getQuestion);

// ── GET /api/questions/:id ────────────────────────
router.get('/:id', validate([ param('id').isMongoId() ]), getQuestionById);

// ── POST /api/questions ───────────────────────────
router.post('/', validate([
	body('classId').isMongoId().withMessage('classId required'),
	body('subjectId').isMongoId().withMessage('subjectId required'),
	body('chapter').trim().notEmpty(),
	body('type').trim().notEmpty(),
	body('question').trim().notEmpty(),
	body('answer').trim().notEmpty()
]), createQuestion);

// ── POST /api/questions/bulk ──────────────────────
router.post('/bulk', validate([
	body('questions').isArray({ min: 1 }).withMessage('questions array required')
]), bulkCreateQuestions);

// ── PUT /api/questions/:id ────────────────────────
router.put('/:id', validate([
	param('id').isMongoId(),
	body('classId').optional().isMongoId(),
	body('subjectId').optional().isMongoId(),
	body('chapter').optional().trim().notEmpty(),
	body('type').optional().trim().notEmpty(),
	body('question').optional().trim().notEmpty(),
	body('answer').optional().trim().notEmpty()
]), updateQuestion);

// ── DELETE /api/questions/:id ─────────────────────
router.delete('/:id', validate([ param('id').isMongoId() ]), deleteQuestion);

module.exports = router;