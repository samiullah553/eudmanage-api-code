const Teacher = require('../models/Teacher');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find(schoolFilter(req));
    res.json(teachers);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// create user

const createTeacher = async (req, res) => {
  try {
    // Basic server-side required field check to provide clearer errors
    const required = ['fname', 'lname', 'empId', 'qualification', 'contact', 'email', 'monthlySalary', 'status'];
    const missing = required.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields', missing });
    }

    console.log('Creating teacher:', req.body);
    const teacher = new Teacher({ ...req.body, schoolId: req.user.schoolId });
    await teacher.save();
    res.status(201).json(teacher);
  } catch(err) {
    console.error('Create teacher error:', err);
    // Handle duplicate key (unique) errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return res.status(400).json({ error: 'Duplicate value', field, value: err.keyValue[field] });
    }
    const validationErrors = err.errors
      ? Object.values(err.errors).map(e => e.message)
      : [];
    res.status(400).json({
      error: err.message,
      validation: validationErrors.length ? validationErrors : undefined,
    });
  }
};

// update teacher
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch(err) {
    res.status(400).json({error: err.message});
  }
};

// delete teacher
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({message: 'Teacher deleted'});
  } catch(err) {
    res.status(400).json({error: err.message});
  }
};


module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
};