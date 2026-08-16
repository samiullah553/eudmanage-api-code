const QuranCourse = require('../models/QuranCourse');
const QuranLesson = require('../models/QuranLesson');
const QuranEnrollment = require('../models/QuranEnrollment');
const QuranProgress = require('../models/QuranProgress');
const EnrollmentRequest = require('../models/EnrollmentRequest');
const User = require('../models/User');

const isAdminLike = (user) => user && ['admin', 'teacher'].includes(String(user.role || '').toLowerCase());

const canUserAccessCourse = (user, course, enrollments = []) => {
  if (!user) return false;
  if (isAdminLike(user)) return true;
  if (!course) return false;
  if (course.isPublished) return true;
  const courseIds = (enrollments || []).map((entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    return entry.course && (entry.course._id || entry.course.toString ? entry.course.toString() : entry.course);
  }).filter(Boolean);
  return courseIds.includes(course._id ? course._id.toString() : String(course));
};

const canUserAccessLesson = (user, courseId, enrollments = []) => {
  if (!user) return false;
  if (isAdminLike(user)) return true;
  const courseIds = (enrollments || []).map((entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    return entry.course && (entry.course._id || entry.course.toString ? entry.course.toString() : entry.course);
  }).filter(Boolean);
  return courseIds.includes(String(courseId));
};

const getUserEnrollmentCourseIds = async (userId) => {
  if (!userId) return [];
  const items = await QuranEnrollment.find({ user: userId }).lean();
  return items.map((entry) => entry.course && entry.course.toString ? entry.course.toString() : String(entry.course));
};

exports.canUserAccessCourse = canUserAccessCourse;
exports.canUserAccessLesson = canUserAccessLesson;

// Courses
exports.listCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, level, teacher, free } = req.query;
    const q = {};
    if (level) q.levels = level;
    if (teacher) q.teacher = teacher;
    if (free === 'true') q.price = 0;
    if (search) q.$text = { $search: search };
    const skip = (page - 1) * limit;
    const items = await QuranCourse.find(q).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });
    const total = await QuranCourse.countDocuments(q);
    return res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.title) return res.status(400).json({ success: false, error: 'Title is required' });
    const course = await QuranCourse.create(payload);
    return res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.getCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await QuranCourse.findById(courseId).lean();
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const userEnrollments = await getUserEnrollmentCourseIds(req.user && req.user._id);
    if (!canUserAccessCourse(req.user, course, userEnrollments)) {
      return res.status(403).json({ success: false, error: 'Enroll to access this course' });
    }

    const lessons = await QuranLesson.find({ course: course._id }).sort({ order: 1 });
    return res.json({ success: true, data: { course, lessons } });
  } catch (err) { next(err); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const updated = await QuranCourse.findByIdAndUpdate(courseId, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Course not found' });
    return res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    await QuranCourse.findByIdAndDelete(courseId);
    return res.json({ success: true, data: null });
  } catch (err) { next(err); }
};

// Lessons
exports.listLessons = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await QuranCourse.findById(courseId).lean();
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const userEnrollments = await getUserEnrollmentCourseIds(req.user && req.user._id);
    if (!canUserAccessCourse(req.user, course, userEnrollments)) {
      return res.status(403).json({ success: false, error: 'Enroll to access this course' });
    }

    const items = await QuranLesson.find({ course: courseId }).sort({ order: 1 });
    return res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const payload = Object.assign({}, req.body, { course: courseId });
    if (!payload.title) return res.status(400).json({ success: false, error: 'Title required' });
    const lesson = await QuranLesson.create(payload);
    return res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

exports.getLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const lesson = await QuranLesson.findById(lessonId).lean();
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    const course = await QuranCourse.findById(lesson.course).lean();
    const userEnrollments = await getUserEnrollmentCourseIds(req.user && req.user._id);
    if (!canUserAccessCourse(req.user, course, userEnrollments) && !canUserAccessLesson(req.user, lesson.course, userEnrollments)) {
      return res.status(403).json({ success: false, error: 'Enroll to access this lesson' });
    }

    return res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

exports.updateLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const updated = await QuranLesson.findByIdAndUpdate(lessonId, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Lesson not found' });
    return res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    await QuranLesson.findByIdAndDelete(lessonId);
    return res.json({ success: true, data: null });
  } catch (err) { next(err); }
};

// Enrollment
exports.enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const existing = await QuranEnrollment.findOne({ course: courseId, user: userId });
    if (existing) return res.json({ success: true, data: existing });
    const enrol = await QuranEnrollment.create({ course: courseId, user: userId, status: 'active' });
    return res.json({ success: true, data: enrol });
  } catch (err) { next(err); }
};

exports.myEnrollments = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const items = await QuranEnrollment.find({ user: userId }).populate('course');
    return res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

// Progress
exports.postProgress = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    const { courseId, lessonId, playedSeconds = 0, completed = false, score } = req.body;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const course = await QuranCourse.findById(courseId).lean();
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const userEnrollments = await getUserEnrollmentCourseIds(userId);
    if (!canUserAccessCourse(req.user, course, userEnrollments)) {
      return res.status(403).json({ success: false, error: 'Enroll to access this course progress' });
    }

    const filter = { user: userId, course: courseId, lesson: lessonId };
    const update = { playedSeconds, completed, meta: req.body.meta || {} };
    if (completed) update.completedAt = new Date();
    if (typeof score !== 'undefined') update.score = score;
    const prog = await QuranProgress.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ success: true, data: prog });
  } catch (err) { next(err); }
};

// Admin: list enrollment requests
exports.listEnrollmentRequests = async (req, res, next) => {
  try {
    if (!isAdminLike(req.user)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const items = await EnrollmentRequest.find().sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
    const total = await EnrollmentRequest.countDocuments();
    return res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

// Admin: accept enrollment request
exports.acceptEnrollmentRequest = async (req, res, next) => {
  try {
    if (!isAdminLike(req.user)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;
    const reqDoc = await EnrollmentRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ success: false, error: 'Request not found' });
    reqDoc.status = 'accepted';
    await reqDoc.save();

    let updatedUser = null;
    // Link to user if available, or try lookup by email
    let user = null;
    if (reqDoc.linkedUser) user = await User.findById(reqDoc.linkedUser);
    if (!user && reqDoc.email) user = await User.findOne({ email: reqDoc.email.toLowerCase().trim() });

    if (user) {
      user.enrolledQuran = true;
      await user.save();
      updatedUser = user;
    }

    // Create QuranEnrollment if possible. Admin may pass a courseId in body.
    const { courseId } = req.body || {};
    let createdEnrollment = null;
    try {
      const chosenCourseId = courseId || null;
      let finalCourseId = chosenCourseId;
      if (!finalCourseId) {
        // pick a published course as fallback
        const c = await QuranCourse.findOne({ isPublished: true }).lean();
        finalCourseId = c ? String(c._id || c.id) : null;
      }
      if (finalCourseId && user) {
        // avoid duplicates
        const exists = await QuranEnrollment.findOne({ course: finalCourseId, user: user._id });
        if (!exists) {
          createdEnrollment = await QuranEnrollment.create({ course: finalCourseId, user: user._id, status: 'active' });
        } else createdEnrollment = exists;
      }
    } catch (e) {
      // don't fail acceptance if enrollment creation fails
      console.warn('Could not create QuranEnrollment on accept:', e.message || e);
    }

    return res.json({ success: true, data: { request: reqDoc, updatedUser, enrollment: createdEnrollment } });
  } catch (err) { next(err); }
};

// Admin: reject enrollment request
exports.rejectEnrollmentRequest = async (req, res, next) => {
  try {
    if (!isAdminLike(req.user)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;
    const reqDoc = await EnrollmentRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ success: false, error: 'Request not found' });
    reqDoc.status = 'rejected';
    await reqDoc.save();
    return res.json({ success: true, data: reqDoc });
  } catch (err) { next(err); }
};
