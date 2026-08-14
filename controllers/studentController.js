const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { error: respError, success: respSuccess } = require('../utils/response');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getStudents = async (req, res) => {
  try {
    // Pagination and filters
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 200);
    const skip = (page - 1) * limit;

    const { q, classId, status, year, startYear, endYear, sort } = req.query;
    const filter = schoolFilter(req);

    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
      filter.$or = [
        { fname: re },
        { lname: re },
        { roll: re },
        { parent: re },
        { email: re }
      ];
    }

    // Year / range filtering on createdAt
    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        filter.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
      }
    } else if (startYear || endYear) {
      const sy = parseInt(startYear || '0', 10);
      const ey = parseInt(endYear || `${new Date().getFullYear()}`, 10);
      if (!isNaN(sy) && !isNaN(ey)) {
        filter.createdAt = { $gte: new Date(sy, 0, 1), $lt: new Date(ey + 1, 0, 1) };
      }
    }

    const sortOpt = sort || '-createdAt';

    const [students, total] = await Promise.all([
      Student.find(filter).populate('classId').sort(sortOpt).skip(skip).limit(limit),
      Student.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return respSuccess(res, { data: students, total, page, limit, totalPages });
  } catch (err) {
    return respError(res, err.message || 'Could not fetch students', 500);
  }
};

// create student
const createStudent = async (req, res) => {
  try {
    const { fname, lname, roll, classId } = req.body || {};
    const schoolId = req.user.schoolId;
    // Debugging: log incoming payload keys and any large fields (do not stringify whole payload)
    try {
      const keys = Object.keys(req.body || {});
      console.log('createStudent payload keys:', keys);
      if (req.body && typeof req.body.photoUrl === 'string') console.log('createStudent.photoUrl.length:', req.body.photoUrl.length);
    } catch (logErr) {
      console.warn('createStudent payload log failed', logErr && logErr.message);
    }

    if (!fname || !lname || !roll) {
      return respError(res, 'Missing required fields: fname, lname, roll', 400, { received: { keys: Object.keys(req.body || {}), fname, lname, roll } });
    }

    // Normalize classId for uniqueness checks: treat missing as null
    const classFilter = classId ? classId : null;
    const exists = await Student.exists({ schoolId: req.user.schoolId, classId: classFilter, roll });
    if (exists) {
      return respError(res, 'Roll number already exists for this class', 400);
    }

    const payload = { ...req.body, schoolId };
    if (!('classId' in payload)) payload.classId = null;
    if (!payload.studentId) {
      const year = new Date().getFullYear();
      const count = await Student.countDocuments({ schoolId });
      payload.studentId = `ST${year}${String(count + 1).padStart(4, '0')}`;
    }
    if (payload.parentIds && !Array.isArray(payload.parentIds)) {
      payload.parentIds = payload.parentIds ? [payload.parentIds] : [];
    }
    const student = new Student(payload);
    await student.save();
    return respSuccess(res, student, 201);
  } catch (err) {
    console.error('createStudent error', err);
    if (err && err.name === 'ValidationError') return respError(res, err.message, 400, err.errors);
    if (err && err.code === 11000) {
      return respError(res, 'Duplicate roll number exists for this class', 400);
    }
    return respError(res, err.message || 'Could not create student', 400);
  }
};

// update student
const updateStudent = async (req, res) => {
  try {
    const { roll, classId } = req.body;
    if (roll !== undefined || classId !== undefined) {
      const studentToUpdate = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
      if (!studentToUpdate) return respError(res, 'Student not found', 404);
      const targetClassId = classId !== undefined ? classId : studentToUpdate.classId;
      const targetRoll = roll !== undefined ? roll : studentToUpdate.roll;
      const classFilter = targetClassId ? targetClassId : null;
      const exists = await Student.exists({
        _id: { $ne: req.params.id },
        schoolId: req.user.schoolId,
        classId: classFilter,
        roll: targetRoll
      });
      if (exists) {
        return respError(res, 'Roll number already exists for this class', 400);
      }
    }

    const payload = { ...req.body, updatedAt: Date.now() };
    if (payload.parentIds && !Array.isArray(payload.parentIds)) {
      payload.parentIds = payload.parentIds ? [payload.parentIds] : [];
    }
    const student = await Student.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId }, payload, { new: true }).populate('classId');
    if (!student) return respError(res, 'Student not found', 404);
    return respSuccess(res, student);
  } catch (err) {
    if (err && err.code === 11000) {
      return respError(res, 'Duplicate roll number exists for this class', 400);
    }
    return respError(res, err.message || 'Could not update student', 400);
  }
};

// get student by id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('classId');
    if (!student) return respError(res, 'Student not found', 404);
    return respSuccess(res, student);
  } catch (err) {
    return respError(res, err.message || 'Could not fetch student', 400);
  }
};

const getStudentLedger = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);
    const invoices = await Invoice.find({ schoolId: req.user.schoolId, studentId }).sort({ dueDate: -1, createdAt: -1 });
    const payments = await Payment.find({ schoolId: req.user.schoolId, studentId }).sort({ createdAt: -1 });
    const invoiceTotal = invoices.reduce((sum, invoice) => sum + (invoice.amountDue || 0), 0);
    const paymentTotal = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return respSuccess(res, { invoices, payments, invoiceTotal, paymentTotal, balance: invoiceTotal - paymentTotal });
  } catch (err) {
    return respError(res, err.message || 'Could not fetch ledger', 500);
  }
};

const uploadStudentPhoto = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);
    const { photoUrl, photoData } = req.body;
    if (photoData) student.photoUrl = photoData;
    else if (photoUrl) student.photoUrl = photoUrl;
    student.updatedAt = Date.now();
    await student.save();
    return respSuccess(res, student);
  } catch (err) {
    return respError(res, err.message || 'Could not upload photo', 400);
  }
};

const addStudentAttachment = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);
    const { title, url, data, type, notes } = req.body;
    if (!title || !(url || data)) return respError(res, 'Attachment title and file/url are required', 400);
    const attachment = {
      title,
      url: url || data,
      type,
      notes,
      uploadedAt: new Date()
    };
    student.documents = student.documents || [];
    student.documents.push(attachment);
    student.updatedAt = Date.now();
    await student.save();
    return respSuccess(res, attachment, 201);
  } catch (err) {
    return respError(res, err.message || 'Could not add attachment', 400);
  }
};

const promoteStudents = async (req, res) => {
  try {
    const { fromClassId, toClassId, studentIds } = req.body;
    if (!fromClassId || !toClassId) {
      return respError(res, 'fromClassId and toClassId are required', 400);
    }
    if (fromClassId === toClassId) {
      return respError(res, 'Source and target class must be different', 400);
    }

    const filter = { schoolId: req.user.schoolId, classId: fromClassId, status: 'Active' };
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      filter._id = { $in: studentIds };
    }

    const result = await Student.updateMany(filter, { classId: toClassId, updatedAt: Date.now() });
    return respSuccess(res, { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (err) {
    return respError(res, err.message || 'Could not promote students', 500);
  }
};

// delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);
    return respSuccess(res, { message: 'Student deleted' });
  } catch (err) {
    return respError(res, err.message || 'Could not delete student', 400);
  }
};

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  getStudentById,
  getStudentLedger,
  uploadStudentPhoto,
  addStudentAttachment,
  promoteStudents,
  deleteStudent
};