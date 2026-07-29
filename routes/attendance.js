// const express = require('express');
// const router = express.Router();
// const Attendance = require('../models/Attendance');
// const { getAttendance, createAttendance, deleteAttendance, bulkCreateAttendance } = require('../controllers/attendanceController');

// // GET attendance for a class on a date
// router.route('/').get(getAttendance);
// // POST/UPDATE attendance record
// router.route('/').post(createAttendance);

// // POST bulk attendance records
// router.route('/bulk').post(bulkCreateAttendance);

// // DELETE attendance record
// router.route('/:id').delete(deleteAttendance);

// module.exports = router;

const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getAttendance,
  createAttendance,
  deleteAttendance,
  bulkCreateAttendance,
  getStudentAttendanceHistory,
  getAttendanceTemplates,
  createAttendanceTemplate,
  deleteAttendanceTemplate,
  getClassAttendanceReport
} = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', validate([
  query('date').optional().isISO8601(),
  query('classId').optional().isMongoId(),
  query('studentId').optional().isMongoId(),
  query('year').optional().isInt({ min: 1900, max: 9999 })
]), getAttendance);

router.post('/', validate([
  body('date').isISO8601().withMessage('date is required'),
  body('classId').isMongoId().withMessage('classId is required'),
  body('studentId').isMongoId().withMessage('studentId is required'),
  body('status').optional().isIn(['P', 'A', 'L', 'E', 'H', 'O']),
  body('reason').optional().isIn(['None', 'Sick', 'Leave', 'Remote', 'Personal', 'Other'])
]), createAttendance);

router.post('/bulk', validate([
  body('date').isISO8601(),
  body('classId').isMongoId(),
  body('absences').isArray({ min: 1 }),
  body('absences.*.studentId').isMongoId(),
  body('absences.*.status').optional().isIn(['P', 'A', 'L', 'E', 'H', 'O']),
  body('absences.*.reason').optional().isIn(['None', 'Sick', 'Leave', 'Remote', 'Personal', 'Other'])
]), bulkCreateAttendance);

router.delete('/:id', validate([ param('id').isMongoId() ]), deleteAttendance);

router.get('/templates', getAttendanceTemplates);
router.post('/templates', validate([
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('classId').isMongoId().withMessage('classId is required'),
  body('entries').isArray({ min: 1 }).withMessage('entries are required'),
  body('entries.*.studentId').isMongoId().withMessage('studentId is required'),
  body('entries.*.status').optional().isIn(['P', 'A', 'L', 'E', 'H', 'O']),
  body('entries.*.reason').optional().isIn(['None', 'Sick', 'Leave', 'Remote', 'Personal', 'Other'])
]), createAttendanceTemplate);
router.delete('/templates/:id', validate([ param('id').isMongoId() ]), deleteAttendanceTemplate);
router.get('/classes/report', validate([
  query('classId').isMongoId().withMessage('classId is required'),
  query('year').optional().isInt({ min: 1900, max: 9999 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
]), getClassAttendanceReport);
router.get('/students/:id/history', validate([
  param('id').isMongoId().withMessage('Invalid student ID'),
  query('year').optional().isInt({ min: 1900, max: 9999 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
]), getStudentAttendanceHistory);

module.exports = router;