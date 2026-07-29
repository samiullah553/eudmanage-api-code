const express = require('express');
const router = express.Router();
const { param, body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { listGradesForStudent, addGradeForStudent, listGradesByClass } = require('../controllers/gradeController');

// List grades for a student
router.get('/student/:id', validate([
	param('id').isMongoId(),
	query('year').optional().isInt({ min: 1900, max: 3000 })
]), listGradesForStudent);

// List grades by class (for grade listing page)
router.get('/', validate([
	query('classId').optional().isMongoId()
]), listGradesByClass);

router.post('/student/:id', validate([
	param('id').isMongoId(),
	body('subject').trim().notEmpty().withMessage('subject required'),
	body('marks').isNumeric().withMessage('marks required'),
	body('total').isNumeric().withMessage('total required'),
	body('type').optional().trim().notEmpty()
]), addGradeForStudent);

module.exports = router;