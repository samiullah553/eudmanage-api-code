const express = require('express');
const router = express.Router();
const QuranCourse = require('../models/QuranCourse');
const QuranLesson = require('../models/QuranLesson');

// Public listing of published Quran courses
router.get('/courses', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, level } = req.query;
    const q = { isPublished: true };
    if (level) {
      q.$or = [
        { level },
        { levels: level }
      ];
    }
    if (search) q.$text = { $search: search };
    const skip = (page - 1) * limit;
    const items = await QuranCourse.find(q).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean();
    const total = await QuranCourse.countDocuments(q);
    return res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
});

// Public preview of a published course and first preview lessons
router.get('/courses/:courseId', async (req, res, next) => {
  try {
    const course = await QuranCourse.findOne({ _id: req.params.courseId, isPublished: true }).lean();
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const previewLessons = await QuranLesson.find({
      course: course._id,
      $or: [{ isPreview: true }, { order: { $lte: 3 } }]
    }).sort({ order: 1 }).limit(10).lean();

    return res.json({ success: true, data: { course, previewLessons } });
  } catch (err) {
    next(err);
  }
});

// Public preview lessons for a course
router.get('/courses/:courseId/lessons', async (req, res, next) => {
  try {
    const course = await QuranCourse.findOne({ _id: req.params.courseId, isPublished: true }).lean();
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const lessons = await QuranLesson.find({
      course: course._id,
      $or: [{ isPreview: true }, { order: { $lte: 3 } }]
    }).sort({ order: 1 }).lean();

    return res.json({ success: true, data: lessons });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
