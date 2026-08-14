const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { error: respError, success: respSuccess } = require('../utils/response');

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

    return respSuccess(res, { data: parents, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return respError(res, err.message || 'Could not fetch parents', 500);
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
    return respSuccess(res, parent, 201);
  } catch (err) {
    if (err && err.name === 'ValidationError') return respError(res, err.message, 400, err.errors);
    return respError(res, err.message || 'Could not create parent', 400);
  }
};

const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!parent) return respError(res, 'Parent not found', 404);
    return respSuccess(res, parent);
  } catch (err) {
    if (err && err.name === 'ValidationError') return respError(res, err.message, 400, err.errors);
    return respError(res, err.message || 'Could not update parent', 400);
  }
};

const getParentById = async (req, res) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!parent) return respError(res, 'Parent not found', 404);
    const students = await Student.find({ schoolId: req.user.schoolId, parentIds: parent._id }).select('_id fname lname roll classId status');
    return respSuccess(res, { ...parent.toObject(), students });
  } catch (err) {
    return respError(res, err.message || 'Could not fetch parent', 400);
  }
};

const linkParentToStudent = async (req, res) => {
  try {
    const parentId = req.params.id;
    const { studentId, relationship, isPrimary } = req.body;

    const parent = await Parent.findOne({ _id: parentId, schoolId: req.user.schoolId });
    if (!parent) return respError(res, 'Parent not found', 404);

    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);

    const existing = student.parentIds || [];
    let hasChanges = false;

    if (!existing.some((id) => String(id) === String(parent._id))) {
      existing.push(parent._id);
      student.parentIds = existing;
      hasChanges = true;
    }

    if (relationship) {
      student.parent = relationship;
      hasChanges = true;
    }
    if (isPrimary) {
      student.parent = `${parent.fname} ${parent.lname}`;
      hasChanges = true;
    }

    if (hasChanges) {
      student.updatedAt = Date.now();
      await student.save();
    }

    return respSuccess(res, { message: 'Parent linked', student });
  } catch (err) {
    return respError(res, err.message || 'Could not link parent', 400);
  }
};

const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!parent) return respError(res, 'Parent not found', 404);
    await Student.updateMany({ schoolId: req.user.schoolId, parentIds: parent._id }, { $pull: { parentIds: parent._id } });
    return respSuccess(res, { message: 'Parent deleted' });
  } catch (err) {
    return respError(res, err.message || 'Could not delete parent', 400);
  }
};

const getMyChildren = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return respError(res, 'Parent access required', 403);
    }

    const parent = await Parent.findOne({ userId: req.user.id, schoolId: req.user.schoolId });
    if (!parent) {
      return respError(res, 'Parent profile not found for this account', 404);
    }

    const students = await Student.find({ schoolId: req.user.schoolId, parentIds: parent._id })
      .select('_id fname lname roll classId status email contact')
      .populate('classId', 'name section');

    return respSuccess(res, { parent, children: students });
  } catch (err) {
    return respError(res, err.message || 'Could not fetch children', 500);
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
