const StudyMaterial = require('../models/StudyMaterial');
const { error: respError, success: respSuccess } = require('../utils/response');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const listMaterials = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 200);
    const skip = (page - 1) * limit;
    const { q, subjectId, classId } = req.query;

    const filter = schoolFilter(req);
    if (subjectId) filter.subjectId = subjectId;
    if (classId) filter.classId = classId;
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
      filter.$or = [{ title: re }, { notes: re }];
    }

    const [items, total] = await Promise.all([
      StudyMaterial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StudyMaterial.countDocuments(filter)
    ]);

    return respSuccess(res, { data: items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return respError(res, err.message || 'Could not list study materials', 500);
  }
};

const createMaterial = async (req, res) => {
  try {
    const payload = { ...req.body, schoolId: req.user.schoolId, createdBy: req.user.id };
    const item = new StudyMaterial(payload);
    await item.save();
    return respSuccess(res, item, 201);
  } catch (err) {
    if (err && err.name === 'ValidationError') return respError(res, err.message, 400, err.errors);
    return respError(res, err.message || 'Could not create study material', 400);
  }
};

const getMaterialById = async (req, res) => {
  try {
    const item = await StudyMaterial.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!item) return respError(res, 'Study material not found', 404);
    return respSuccess(res, item);
  } catch (err) {
    return respError(res, err.message || 'Could not fetch study material', 400);
  }
};

const updateMaterial = async (req, res) => {
  try {
    const item = await StudyMaterial.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId }, { ...req.body, updatedAt: Date.now() }, { new: true, runValidators: true, context: 'query' });
    if (!item) return respError(res, 'Study material not found', 404);
    return respSuccess(res, item);
  } catch (err) {
    if (err && err.name === 'ValidationError') return respError(res, err.message, 400, err.errors);
    return respError(res, err.message || 'Could not update study material', 400);
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const item = await StudyMaterial.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!item) return respError(res, 'Study material not found', 404);
    return respSuccess(res, { message: 'Deleted' });
  } catch (err) {
    return respError(res, err.message || 'Could not delete study material', 400);
  }
};

module.exports = {
  listMaterials,
  createMaterial,
  getMaterialById,
  updateMaterial,
  deleteMaterial
};
