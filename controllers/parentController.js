const Parent = require('../models/Parent');
const Student = require('../models/Student');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getParents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 200);
    const skip = (page - 1) * limit;
    const { q } = req.query;

    const filter = schoolFilter(req);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
      filter.$or = [{ fname: re }, { lname: re }, { email: re }, { phone: re }];
    }

    const [parents, total] = await Promise.all([
      Parent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Parent.countDocuments(filter)
    ]);

    res.json({ data: parents, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createParent = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      schoolId: req.user.schoolId,
      status: req.body.status || 'Active'
    };

    const parent = new Parent(payload);
    await parent.save();
    res.status(201).json(parent);
  } catch (err) {
    if (err && err.name === 'ValidationError') return res.status(400).json({ error: err.message, details: err.errors });
    res.status(400).json({ error: err.message });
  }
};

const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId }, { ...req.body, updatedAt: Date.now() }, { new: true });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    res.json(parent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getParentById = async (req, res) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const students = await Student.find({ schoolId: req.user.schoolId, parentIds: parent._id }).select('_id fname lname roll classId status');
    res.json({ ...parent.toObject(), students });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const linkParentToStudent = async (req, res) => {
  try {
    const { parentId, relationship, isPrimary } = req.body;
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const parent = await Parent.findOne({ _id: parentId, schoolId: req.user.schoolId });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const existing = student.parentIds || [];
    if (!existing.some((id) => String(id) === String(parent._id))) {
      existing.push(parent._id);
      student.parentIds = existing;
      if (relationship) {
        student.parent = relationship;
      }
      if (isPrimary) {
        student.parent = parent.fname + ' ' + parent.lname;
      }
      student.updatedAt = Date.now();
      await student.save();
    }

    res.json({ message: 'Parent linked', student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    await Student.updateMany({ schoolId: req.user.schoolId, parentIds: parent._id }, { $pull: { parentIds: parent._id } });
    res.json({ message: 'Parent deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyChildren = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Parent access required' });
    }

    const parent = await Parent.findOne({ userId: req.user.id, schoolId: req.user.schoolId });
    if (!parent) {
      return res.status(404).json({ error: 'Parent profile not found for this account' });
    }

    const students = await Student.find({ schoolId: req.user.schoolId, parentIds: parent._id })
      .select('_id fname lname roll classId status email contact')
      .populate('classId', 'name section');

    res.json({ parent, children: students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getParents,
  createParent,
  updateParent,
  getParentById,
  linkParentToStudent,
  deleteParent,
  getMyChildren
};
