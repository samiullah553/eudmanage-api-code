const Task = require('../models/Task');
const Question = require('../models/Questions');
const mongoose = require('mongoose');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

// Get all tasks with filtering
const getTasks = async (req, res) => {
  try {
    const { type, classId, status, sort } = req.query;
    const filter = schoolFilter(req);

    if (type) filter.type = type;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    const sortOpt = sort || '-createdAt';
    const tasks = await Task.find(filter)
      .populate('classId')
      .populate('subjectId')
      .populate('createdBy', 'fname lname')
      .sort(sortOpt);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, schoolId: req.user.schoolId })
      .populate('classId')
      .populate('subjectId')
      .populate('createdBy');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// create Task
// const createTask = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       type,
//       classId,
//       subjectId,
//       subject,
//       dueDate,
//       marks,
//       instructions,
//       status,
//       questions   // ✅ ADD THIS — was missing entirely
//     } = req.body;

//     // ── Required field checks ──────────────────────
//     if (!title || !type) {
//       return res.status(400).json({ error: 'Title and type are required' });
//     }
//     if (!['Summer', 'Winter'].includes(type)) {
//       return res.status(400).json({ error: 'Type must be Summer or Winter' });
//     }

//     // ── Build task object ──────────────────────────
//     const taskData = {
//       title,
//       type,
//       marks:        marks || 0,
//       status:       status || 'Active',
//       instructions: instructions || '',
//       description:  description  || '',
//       subject:      subject      || '',
//       createdBy:    req.user?._id || null,
//     };

//     // ✅ Only set classId if it's a valid non-empty value
//     // Empty string "" causes Mongoose CastError → 500
//     if (classId && classId.toString().trim() !== '') {
//       taskData.classId = classId;
//     }
//     if (subjectId && subjectId.toString().trim() !== '') {
//       taskData.subjectId = subjectId;
//     }
//     if (dueDate && dueDate.toString().trim() !== '') {
//       taskData.dueDate = dueDate;
//     }

//     // ✅ Include questions array — sanitize each entry
//     if (Array.isArray(questions) && questions.length > 0) {
//       taskData.questions = questions.map(q => ({
//         questionId: q.questionId || q._id || undefined,
//         question:   q.question   || '',
//         type:       q.type       || 'short',
//         difficulty: q.difficulty || 'medium',
//         marks:      q.marks      || 1,
//         options:    Array.isArray(q.options) ? q.options : [],
//         answer:     q.answer     || '',
//         chapter:    q.chapter    || '',
//         wordLimit:  q.wordLimit  || null,
//       }));

//       // Auto-calculate total marks from questions if marks not provided
//       if (!marks || marks === 0) {
//         taskData.marks = taskData.questions.reduce(
//           (sum, q) => sum + (q.marks || 0), 0
//         );
//       }
//     }

//     // ── Save ───────────────────────────────────────
//     const task = new Task(taskData);
//     await task.save();

//     // ✅ Populate safely — only populate fields that exist
//     try {
//       const populateFields = [];
//       if (taskData.classId)   populateFields.push('classId');
//       if (taskData.subjectId) populateFields.push('subjectId');
//       if (taskData.createdBy) populateFields.push('createdBy');
//       if (populateFields.length) {
//         await task.populate(populateFields.join(' '));
//       }
//     } catch (popErr) {
//       // Populate failed — still return the task, just without populated fields
//       console.warn('Task populate warning:', popErr.message);
//     }

//     res.status(201).json(task);

//   } catch (err) {
//     console.error('createTask error:', err.name, err.message);

//     // ✅ Handle specific error types with correct status codes
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({
//         error: 'Validation failed',
//         details: Object.values(err.errors).map(e => e.message)
//       });
//     }
//     if (err.name === 'CastError') {
//       return res.status(400).json({
//         error: `Invalid value for field "${err.path}": ${err.value}`
//       });
//     }

//     // ✅ Use 500 for genuine server errors, not 400
//     res.status(500).json({ error: err.message });
//   }
// };
const createTask = async (req, res) => {
  try {
    const {
      title, description, type, classId, subjectId,
      subject, dueDate, marks, instructions, status, questions
    } = req.body;

    // ── Required field checks ──────────────────────
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }
    if (!['Summer', 'Winter'].includes(type)) {
      return res.status(400).json({ error: 'Type must be Summer or Winter' });
    }

    // ── Build task object ──────────────────────────
    const taskData = {
      title,
      type,
      marks:        marks || 0,
      status:       status || 'Active',
      instructions: instructions || '',
      description:  description  || '',
      subject:      subject      || '',
      createdBy:    req.user?._id || null,
    };

    // ✅ Only set ObjectId fields if valid 24-char hex
    const isValidId = id =>
      id &&
      typeof id === 'string' &&
      id.trim() !== '' &&
      mongoose.Types.ObjectId.isValid(id);

    if (isValidId(classId))   taskData.classId   = new mongoose.Types.ObjectId(classId);
    if (isValidId(subjectId)) taskData.subjectId = new mongoose.Types.ObjectId(subjectId);
    if (dueDate && dueDate.toString().trim() !== '') taskData.dueDate = dueDate;

    // ── Sanitize questions array ───────────────────
    if (Array.isArray(questions) && questions.length > 0) {
      taskData.questions = questions.map((q, i) => {
        const item = {
          question:   q.question   || '',
          type:       q.type       || 'short',
          difficulty: q.difficulty || 'medium',
          marks:      Number(q.marks) || 1,
          options:    Array.isArray(q.options) ? q.options : [],
          answer:     q.answer  || '',
          chapter:    q.chapter || '',
        };

        // ✅ Only include questionId if it's a valid ObjectId
        const qid = q.questionId || q._id;
        if (isValidId(qid)) {
          item.questionId = new mongoose.Types.ObjectId(qid);
        }
        // If invalid — omit questionId entirely, don't crash

        // ✅ Only include wordLimit if it's a real positive number
        const wl = parseInt(q.wordLimit);
        if (!isNaN(wl) && wl > 0) {
          item.wordLimit = wl;
        }
        // If not a number — omit wordLimit entirely, don't send null

        return item;
      });

      // Auto-calculate marks if not provided
      if (!marks || marks === 0) {
        taskData.marks = taskData.questions.reduce(
          (sum, q) => sum + (q.marks || 0), 0
        );
      }
    }

    // ── Save ───────────────────────────────────────
    const task = new Task({ ...taskData, schoolId: req.user.schoolId });
    await task.save();

    // ── Populate safely ────────────────────────────
    try {
      const toPopulate = [];
      if (taskData.classId)   toPopulate.push('classId');
      if (taskData.subjectId) toPopulate.push('subjectId');
      if (taskData.createdBy) toPopulate.push('createdBy');
      if (toPopulate.length)  await task.populate(toPopulate.join(' '));
    } catch (popErr) {
      console.warn('Task populate warning:', popErr.message);
    }

    res.status(201).json(task);

  } catch (err) {
    console.error('createTask error:', err.name, err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error:   'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({
        error: `Invalid value for field "${err.path}": ${err.value}`
      });
    }

    res.status(500).json({ error: err.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const payload = { ...req.body, updatedAt: Date.now() };
    const task = await Task.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId }, payload, { new: true })
      .populate('classId')
      .populate('subjectId')
      .populate('createdBy');
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add attachment to task
const addTaskAttachment = async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

    const task = await Task.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.attachments = task.attachments || [];
    task.attachments.push({ title, url, uploadedAt: new Date() });
    task.updatedAt = Date.now();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskAttachment
};
