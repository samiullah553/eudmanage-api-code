const Subject = require('../models/Subject');
const ClassModel = require('../models/Class');
const Teacher = require('../models/Teacher');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getSubjects = async (req, res) => {
  try {
    const q = schoolFilter(req);
    if (req.query.teacherId) q.teacherId = req.query.teacherId;
    if (req.query.classId) q.classIds = req.query.classId;
    const subjects = await Subject.find(q).populate('teacherId classIds');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('teacherId classIds');
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code, dept, teacherId, classIds, credits } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required' });
    const payload = { schoolId: req.user.schoolId, name, code, dept, teacherId, credits: credits || 3 };
    if (Array.isArray(classIds)) payload.classIds = classIds;
    const subject = new Subject(payload);
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const { name, code, dept, teacherId, classIds, credits } = req.body;
    subject.name = name !== undefined ? name : subject.name;
    subject.code = code !== undefined ? code : subject.code;
    subject.dept = dept !== undefined ? dept : subject.dept;
    subject.teacherId = teacherId !== undefined ? teacherId : subject.teacherId;
    subject.classIds = Array.isArray(classIds) ? classIds : subject.classIds;
    subject.credits = credits !== undefined ? credits : subject.credits;
    subject.updatedAt = new Date();
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};
