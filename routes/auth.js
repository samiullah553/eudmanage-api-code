const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const Parent = require('../models/Parent');
const { signToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const resolveSchool = async ({ schoolId, schoolCode }) => {
  if (schoolId) return School.findById(schoolId);
  if (schoolCode) return School.findOne({ code: schoolCode.trim().toUpperCase() });
  return null;
};

const ensureParentProfile = async (user) => {
  if (user.role !== 'parent') return null;

  const existing = await Parent.findOne({ schoolId: user.schoolId, userId: user._id });
  if (existing) return existing;

  const [fname, ...rest] = (user.name || user.email || 'Parent').split(/\s+/);
  const lname = rest.join(' ') || 'User';

  const parent = new Parent({
    schoolId: user.schoolId,
    userId: user._id,
    fname,
    lname,
    email: user.email,
    status: 'Active'
  });

  await parent.save();
  return parent;
};

router.post('/register', validate([
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('schoolId').optional().isMongoId().withMessage('Invalid schoolId'),
  body('schoolCode').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'teacher', 'student', 'parent'])
]), async (req, res, next) => {
  try {
    const { email, password, name, role, schoolId, schoolCode } = req.body;
    const school = await resolveSchool({ schoolId, schoolCode });
    if (!school) return res.status(400).json({ error: 'School not found. Provide a valid schoolId or schoolCode.' });

    const existing = await User.findOne({ email, schoolId: school._id });
    if (existing) return res.status(400).json({ error: 'Email already in use for this school' });

    const user = new User({ email, password, name, role, schoolId: school._id });
    await user.save();
    await ensureParentProfile(user);

    res.status(201).json({
      token: signToken(user),
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        id: user._id,
        schoolId: user.schoolId,
        school: { id: school._id, name: school.name, code: school.code }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate([
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('schoolId').optional().isMongoId().withMessage('Invalid schoolId'),
  body('schoolCode').optional().trim().notEmpty()
]), async (req, res, next) => {
  try {
    const { email, password, schoolId, schoolCode } = req.body;
    const school = await resolveSchool({ schoolId, schoolCode });
    if (!school) return res.status(400).json({ error: 'School not found. Provide a valid schoolId or schoolCode.' });

    const user = await User.findOne({ email, schoolId: school._id }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    await ensureParentProfile(user);

    res.json({
      token: signToken(user),
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        id: user._id,
        schoolId: user.schoolId,
        school: { id: school._id, name: school.name, code: school.code }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;