// // backend/routes/students.js
// const express = require('express');
// const router = express.Router();
// const Student = require('../models/Student');
// const { getStudents,
//    createStudent,
//    updateStudent,
//    deleteStudent,
//    getStudentById,
//    getStudentLedger,
//    uploadStudentPhoto,
//    addStudentAttachment } = require('../controllers/studentController');
// const { getStudentAttendanceSummary } = require('../controllers/attendanceController');
// const gradeController = require('../controllers/gradeController');

// // GET all students
// router.route('/').get(getStudents);
// // POST new student
// router.route('/').post(createStudent);
// // GET student ledger
// router.route('/:id/ledger').get(getStudentLedger);
// // Attendance summary for student
// router.route('/:id/attendance-summary').get(getStudentAttendanceSummary);
// // Grades for student
// router.route('/:id/grades').get(gradeController.listGradesForStudent).post(gradeController.addGradeForStudent);
// // Upload student photo
// router.route('/:id/photo').post(uploadStudentPhoto);
// // Add student attachment
// router.route('/:id/attachments').post(addStudentAttachment);
// // GET student by id
// router.route('/:id').get(getStudentById);
// // PUT update student
// router.route('/:id').put(updateStudent);
// // DELETE student
// router.route('/:id').delete(deleteStudent);

// module.exports = router;

const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { getStudents, createStudent, updateStudent, deleteStudent, getStudentById, getStudentLedger, uploadStudentPhoto, addStudentAttachment, promoteStudents } = require('../controllers/studentController');
const { getStudentAttendanceSummary } = require('../controllers/attendanceController');
const gradeController = require('../controllers/gradeController');

const router = express.Router();

router.get('/', validate([
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('classId').optional().isMongoId(),
  query('status').optional().isIn(['Active', 'Inactive', 'Graduated']),
  query('year').optional().isInt({ min: 1900, max: 9999 }),
  query('startYear').optional().isInt({ min: 1900, max: 9999 }),
  query('endYear').optional().isInt({ min: 1900, max: 9999 }),
  query('q').optional().trim().escape(),
  query('sort').optional()
]), getStudents);

router.post('/', validate([
  body('fname').trim().notEmpty().withMessage('First name is required'),
  body('lname').trim().notEmpty().withMessage('Last name is required'),
  body('roll').trim().notEmpty().withMessage('Roll number is required'),
  body('classId').optional().isMongoId().withMessage('Invalid class ID'),
  body('parent').optional().trim().escape(),
  body('contact').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('dob').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('fee').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['Active', 'Inactive', 'Graduated']),
  body('enrollmentStatus').optional().isIn(['Pending', 'Admitted', 'Active', 'Graduated', 'Left']),
  body('admissionDate').optional().isISO8601().withMessage('Invalid admission date'),
  body('studentId').optional().trim().escape(),
  body('blood').optional().trim().escape(),
  body('addr').optional().trim().escape(),
  body('emergencyContacts').optional().isArray(),
  body('emergencyContacts.*.name').optional().trim().escape(),
  body('emergencyContacts.*.relationship').optional().trim().escape(),
  body('emergencyContacts.*.phone').optional().isMobilePhone().optional(),
  body('emergencyContacts.*.email').optional().isEmail().optional(),
  body('medical.allergies').optional().trim().escape(),
  body('medical.conditions').optional().trim().escape(),
  body('medical.notes').optional().trim().escape()
]), createStudent);

router.post('/promote', validate([
  body('fromClassId').trim().notEmpty().isMongoId().withMessage('fromClassId is required'),
  body('toClassId').trim().notEmpty().isMongoId().withMessage('toClassId is required'),
  body('studentIds').optional().isArray().withMessage('studentIds must be an array'),
  body('studentIds.*').optional().isMongoId().withMessage('Invalid student ID')
]), promoteStudents);

router.get('/:id/ledger', validate([
  param('id').isMongoId().withMessage('Invalid student ID')
]), getStudentLedger);

router.get('/:id/attendance-summary', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  query('year').optional().isInt({ min: 1900, max: 9999 })
]), getStudentAttendanceSummary);

router.get('/:id/grades', validate([
  param('id').isMongoId().withMessage('Invalid student ID')
]), gradeController.listGradesForStudent);

router.post('/:id/grades', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('marks').isFloat({ min: 0 }).withMessage('Marks must be a non-negative number'),
  body('total').optional().isFloat({ min: 0 }).withMessage('Total must be a non-negative number'),
  body('type').optional().trim().escape(),
  body('term').optional().trim().escape()
]), gradeController.addGradeForStudent);

router.post('/:id/photo', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('photoUrl').optional().trim(),
  body('photoData').optional()
]), uploadStudentPhoto);

router.post('/:id/attachments', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('url').optional().trim(),
  body('data').optional(),
  body('type').optional().trim().escape(),
  body('notes').optional().trim().escape()
]), addStudentAttachment);

router.get('/:id', validate([
  param('id').isMongoId().withMessage('Invalid student ID')
]), getStudentById);

router.put('/:id', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('roll').optional().trim().notEmpty().withMessage('Roll cannot be empty'),
  body('classId').optional().isMongoId().withMessage('Invalid class ID'),
  body('parent').optional().trim().escape(),
  body('contact').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('dob').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('fee').optional().isInt({ min: 0 }),
  body('paid').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['Active', 'Inactive', 'Graduated']),
  body('enrollmentStatus').optional().isIn(['Pending', 'Admitted', 'Active', 'Graduated', 'Left']),
  body('admissionDate').optional().isISO8601().withMessage('Invalid admission date'),
  body('studentId').optional().trim().escape(),
  body('blood').optional().trim().escape(),
  body('addr').optional().trim().escape(),
  body('emergencyContacts').optional().isArray(),
  body('medical.allergies').optional().trim().escape(),
  body('medical.conditions').optional().trim().escape(),
  body('medical.notes').optional().trim().escape()
]), updateStudent);

router.delete('/:id', validate([
  param('id').isMongoId().withMessage('Invalid student ID')
]), deleteStudent);

module.exports = router;