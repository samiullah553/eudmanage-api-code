const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

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
    res.json({ data: students, total, page, limit, totalPages });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      return res.status(400).json({ error: 'Missing required fields: fname, lname, roll', received: { keys: Object.keys(req.body || {}), fname, lname, roll } });
    }

    if (classId) {
      const exists = await Student.exists({ schoolId: req.user.schoolId, classId, roll });
      if (exists) {
        return res.status(400).json({ error: 'Roll number already exists for this class' });
      }
    }

    const payload = { ...req.body, schoolId };
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
    res.status(201).json(student);
  } catch (err) {
    console.error('createStudent error', err);
    if (err && err.name === 'ValidationError') return res.status(400).json({ error: err.message, details: err.errors });
    if (err && err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate roll number exists for this class' });
    }
    res.status(400).json({ error: err.message });
  }
};

// update student
const updateStudent = async (req, res) => {
  try {
    const { roll, classId } = req.body;
    if (roll !== undefined || classId !== undefined) {
      const studentToUpdate = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
      if (!studentToUpdate) return res.status(404).json({ error: 'Student not found' });
      const targetClassId = classId !== undefined ? classId : studentToUpdate.classId;
      const targetRoll = roll !== undefined ? roll : studentToUpdate.roll;
      if (targetClassId) {
        const exists = await Student.exists({
          _id: { $ne: req.params.id },
          schoolId: req.user.schoolId,
          classId: targetClassId,
          roll: targetRoll
        });
        if (exists) {
          return res.status(400).json({ error: 'Roll number already exists for this class' });
        }
      }
    }

    const payload = { ...req.body, updatedAt: Date.now() };
    if (payload.parentIds && !Array.isArray(payload.parentIds)) {
      payload.parentIds = payload.parentIds ? [payload.parentIds] : [];
    }
    const student = await Student.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId }, payload, { new: true }).populate('classId');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate roll number exists for this class' });
    }
    res.status(400).json({ error: err.message });
  }
};

// get student by id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('classId');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getStudentLedger = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const invoices = await Invoice.find({ schoolId: req.user.schoolId, studentId }).sort({ dueDate: -1, createdAt: -1 });
    const payments = await Payment.find({ schoolId: req.user.schoolId, studentId }).sort({ createdAt: -1 });
    const invoiceTotal = invoices.reduce((sum, invoice) => sum + (invoice.amountDue || 0), 0);
    const paymentTotal = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    res.json({ invoices, payments, invoiceTotal, paymentTotal, balance: invoiceTotal - paymentTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadStudentPhoto = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const { photoUrl, photoData } = req.body;
    if (photoData) student.photoUrl = photoData;
    else if (photoUrl) student.photoUrl = photoUrl;
    student.updatedAt = Date.now();
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const addStudentAttachment = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const { title, url, data, type, notes } = req.body;
    if (!title || !(url || data)) return res.status(400).json({ error: 'Attachment title and file/url are required' });
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
    res.status(201).json(attachment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const promoteStudents = async (req, res) => {
  try {
    const { fromClassId, toClassId, studentIds } = req.body;
    if (!fromClassId || !toClassId) {
      return res.status(400).json({ error: 'fromClassId and toClassId are required' });
    }
    if (fromClassId === toClassId) {
      return res.status(400).json({ error: 'Source and target class must be different' });
    }

    const filter = { schoolId: req.user.schoolId, classId: fromClassId, status: 'Active' };
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      filter._id = { $in: studentIds };
    }

    const result = await Student.updateMany(filter, { classId: toClassId, updatedAt: Date.now() });
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
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