// // backend/routes/teachers.js
// const express = require('express');
// const router = express.Router();
// const { getTeachers,
//    getTeacher,
//    createTeacher, 
//    updateTeacher, 
//    deleteTeacher } = require('../controllers/teacherController');

// // GET all teachers
// router.route('/').get(getTeachers);
// // POST new teacher
// router.route('/').post(createTeacher);
// // GET, update, or delete a teacher by id
// router.route('/:id').get(getTeacher).put(updateTeacher).delete(deleteTeacher);

// module.exports = router;

const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');

const router = express.Router();

router.get('/', validate([
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 })
]), getTeachers);

router.post('/', validate([
  body('fname').trim().notEmpty().withMessage('First name is required'),
  body('lname').trim().notEmpty().withMessage('Last name is required'),
  body('empId').optional().trim().escape(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('contact').isMobilePhone().withMessage('Valid phone number is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('department').optional().trim().escape(),
  body('dob').optional().isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a non-negative number'),
  body('joiningDate').optional().isISO8601().withMessage('Invalid joining date'),
  body('address').optional().trim().escape(),
  body('bank').optional().trim().escape(),
  body('accountNumber').optional().trim().escape()
]), createTeacher);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid teacher ID')
]), getTeacher);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid teacher ID'),
  body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('empId').optional().trim().escape(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('contact').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('qualification').optional().trim().notEmpty().withMessage('Qualification cannot be empty'),
  body('department').optional().trim().escape(),
  body('dob').optional().isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a non-negative number'),
  body('joiningDate').optional().isISO8601().withMessage('Invalid joining date'),
  body('address').optional().trim().escape(),
  body('bank').optional().trim().escape(),
  body('accountNumber').optional().trim().escape()
]), updateTeacher);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid teacher ID')
]), deleteTeacher);

module.exports = router;