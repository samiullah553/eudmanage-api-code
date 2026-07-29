const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { getTimetables, getTimetable, createTimetable, updateTimetable, deleteTimetable } = require('../controllers/timetableController');

router.get('/', validate([
	query('classId').optional().isMongoId(),
	query('dayOfWeek').optional().isInt({ min: 1, max: 5 })
] ), getTimetables);

router.get('/:id', validate([ param('id').isMongoId().withMessage('Invalid timetable ID') ]), getTimetable);

router.post('/', validate([
	body('classId').isMongoId().withMessage('classId is required'),
	body('subjectId').optional().isMongoId(),
	body('teacherId').optional().isMongoId(),
	body('dayOfWeek').isInt({ min: 1, max: 5 }).withMessage('dayOfWeek must be 1-5'),
	body('slot').isInt({ min: 1 }).withMessage('slot must be numeric and at least 1')
]), createTimetable);

router.put('/:id', validate([
	param('id').isMongoId().withMessage('Invalid timetable ID'),
	body('classId').optional().isMongoId(),
	body('subjectId').optional().isMongoId(),
	body('teacherId').optional().isMongoId(),
	body('dayOfWeek').optional().isInt({ min: 1, max: 5 }),
	body('slot').optional().isInt({ min: 1 })
]), updateTimetable);

router.delete('/:id', validate([ param('id').isMongoId().withMessage('Invalid timetable ID') ]), deleteTimetable);

module.exports = router;
