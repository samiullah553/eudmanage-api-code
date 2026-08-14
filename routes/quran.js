const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quranController');

// Courses
router.get('/courses', ctrl.listCourses);
router.post('/courses', ctrl.createCourse);
router.get('/courses/:courseId', ctrl.getCourse);
router.put('/courses/:courseId', ctrl.updateCourse);
router.delete('/courses/:courseId', ctrl.deleteCourse);

// Lessons
router.get('/courses/:courseId/lessons', ctrl.listLessons);
router.post('/courses/:courseId/lessons', ctrl.createLesson);
router.get('/lessons/:lessonId', ctrl.getLesson);
router.put('/lessons/:lessonId', ctrl.updateLesson);
router.delete('/lessons/:lessonId', ctrl.deleteLesson);

// Enrollment
router.post('/courses/:courseId/enroll', ctrl.enrollCourse);
router.get('/enrollments/my', ctrl.myEnrollments);

// Progress
router.post('/progress', ctrl.postProgress);

module.exports = router;
