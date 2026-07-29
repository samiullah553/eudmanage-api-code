// const Question = require('../models/Questions')


// // ── GET /api/questions ─────────────────────────────
// // Query params: classId, subjectId, chapter, type, difficulty
// const getQuestion =  async (req, res) => {
//   try {
//     const filter = {};
//     if (req.query.classId)   filter.classId   = req.query.classId;
//     if (req.query.subjectId) filter.subjectId = req.query.subjectId;
//     if (req.query.chapter)   filter.chapter   = req.query.chapter;
//     if (req.query.type)      filter.type      = req.query.type;
//     if (req.query.difficulty)filter.difficulty= req.query.difficulty;

//     const questions = await Question.find(filter).sort({ chapter: 1, difficulty: 1, createdAt: -1 });
//     res.json(questions);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ── GET /api/questions/chapters ───────────────────
// // Returns distinct chapters for a classId + subjectId combo
// const getChapter =  async (req, res) => {
//   try {
//     const { classId, subjectId } = req.query;
//     if (!classId || !subjectId)
//       return res.status(400).json({ error: 'classId and subjectId required' });

//     const chapters = await Question.distinct('chapter', { classId, subjectId });
//     res.json(chapters.sort());
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// const getQuestionById =  async (req, res) => {
//   try {
//     const q = await Question.findById(req.params.id);
//     if (!q) return res.status(404).json({ error: 'Question not found' });
//     res.json(q);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ── POST /api/questions ───────────────────────────
// const createQuestion =  async (req, res) => {
//   try {
//     const q = new Question(req.body);
//     await q.save();
//     res.status(201).json(q);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // ── POST /api/questions/bulk ──────────────────────
// // Import multiple questions at once (JSON upload)
// const createQuestionsBulk = async (req, res) => {
//   try {
//     const { questions } = req.body;
//     if (!Array.isArray(questions) || !questions.length)
//       return res.status(400).json({ error: 'questions array required' });

//     const inserted = await Question.insertMany(questions, { ordered: false });
//     res.status(201).json({ inserted: inserted.length, questions: inserted });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // ── PUT /api/questions/:id ────────────────────────
// const updateQuestion =  async (req, res) => {
//   try {
//     const q = await Question.findByIdAndUpdate(
//       req.params.id,
//       { ...req.body, updatedAt: new Date() },
//       { new: true, runValidators: true }
//     );
//     if (!q) return res.status(404).json({ error: 'Question not found' });
//     res.json(q);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };


// // ── DELETE /api/questions/:id ─────────────────────

// const deleteQuestion = async (req, res) => {
//   try {
//     const q = await Question.findByIdAndDelete(req.params.id);
//     if (!q) return res.status(404).json({ error: 'Question not found' });
//     res.json({ deleted: true, id: req.params.id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// module.exports = {
//   getQuestion,
//   getChapter,
//   getQuestionById,
//   createQuestion,
//   createQuestionsBulk,
//   updateQuestion,
//   deleteQuestion
// };

const mongoose = require('mongoose');
const Question = require('../models/Questions')

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

// ── GET /api/questions ────────────────────────────
const getQuestion = async (req, res) => {
  try {
    console.log('createQuestion body:', JSON.stringify(req.body, null, 2));
    const filter = schoolFilter(req);

    // ✅ Cast ObjectId fields — plain strings don't match stored ObjectIds
    if (req.query.classId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.classId)) {
        return res.status(400).json({ error: `Invalid classId: ${req.query.classId}` });
      }
      filter.classId = new mongoose.Types.ObjectId(req.query.classId);
    }

    if (req.query.subjectId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subjectId)) {
        return res.status(400).json({ error: `Invalid subjectId: ${req.query.subjectId}` });
      }
      filter.subjectId = new mongoose.Types.ObjectId(req.query.subjectId);
    }

    // ✅ These are plain strings — no casting needed
    if (req.query.chapter)    filter.chapter    = req.query.chapter;
    if (req.query.type)       filter.type       = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const questions = await Question
      .find(filter)
      .sort({ chapter: 1, difficulty: 1, createdAt: -1 });

    res.json(questions);

  } catch (err) {
    console.error('getQuestion error:', err.name, err.message);

    if (err.name === 'CastError') {
      return res.status(400).json({ error: `Invalid ID format: ${err.value}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/questions/chapters ───────────────────
const getChapters = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;

    if (!classId || !subjectId) {
      return res.status(400).json({ error: 'classId and subjectId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: `Invalid classId: ${classId}` });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ error: `Invalid subjectId: ${subjectId}` });
    }

    const chapters = await Question.distinct('chapter', schoolFilter(req, {
      classId:   new mongoose.Types.ObjectId(classId),
      subjectId: new mongoose.Types.ObjectId(subjectId),
    }));

    res.json(chapters.sort());

  } catch (err) {
    console.error('getChapters error:', err.name, err.message);

    if (err.name === 'CastError') {
      return res.status(400).json({ error: `Invalid ID format: ${err.value}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/questions/:id ────────────────────────
const getQuestionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }
    const question = await Question.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (err) {
    console.error('getQuestionById error:', err.name, err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/questions ───────────────────────────
const createQuestion = async (req, res) => {
  try {
    console.log('createQuestion body:', JSON.stringify(req.body, null, 2));
    const { classId, subjectId, chapter, type, question, answer } = req.body;

    // Required field check
    if (!classId || !subjectId || !chapter || !type || !question || !answer) {
      return res.status(400).json({
        error: 'Missing required fields: classId, subjectId, chapter, type, question, answer'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: `Invalid classId: ${classId}` });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ error: `Invalid subjectId: ${subjectId}` });
    }

    const q = new Question({
      ...req.body,
      schoolId: req.user.schoolId,
      classId:   new mongoose.Types.ObjectId(classId),
      subjectId: new mongoose.Types.ObjectId(subjectId),
    });

    await q.save();
    res.status(201).json(q);

  } catch (err) {
    console.error('createQuestion error:', err.name, err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/questions/bulk ──────────────────────
const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ error: 'questions array is required' });
    }

    // Validate and cast each question
    const prepared = questions.map((q, i) => {
      if (!q.classId || !mongoose.Types.ObjectId.isValid(q.classId)) {
        throw new Error(`Question ${i + 1}: invalid or missing classId "${q.classId}"`);
      }
      if (!q.subjectId || !mongoose.Types.ObjectId.isValid(q.subjectId)) {
        throw new Error(`Question ${i + 1}: invalid or missing subjectId "${q.subjectId}"`);
      }
      return {
        ...q,
        schoolId: req.user.schoolId,
        classId:   new mongoose.Types.ObjectId(q.classId),
        subjectId: new mongoose.Types.ObjectId(q.subjectId),
      };
    });

    const inserted = await Question.insertMany(prepared, { ordered: false });
    res.status(201).json({ inserted: inserted.length, questions: inserted });

  } catch (err) {
    console.error('bulkCreateQuestions error:', err.name, err.message);
    res.status(400).json({ error: err.message });
  }
};

// ── PUT /api/questions/:id ────────────────────────
const updateQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const update = { ...req.body, updatedAt: new Date() };

    // Cast if provided
    if (update.classId) {
      if (!mongoose.Types.ObjectId.isValid(update.classId)) {
        return res.status(400).json({ error: `Invalid classId: ${update.classId}` });
      }
      update.classId = new mongoose.Types.ObjectId(update.classId);
    }
    if (update.subjectId) {
      if (!mongoose.Types.ObjectId.isValid(update.subjectId)) {
        return res.status(400).json({ error: `Invalid subjectId: ${update.subjectId}` });
      }
      update.subjectId = new mongoose.Types.ObjectId(update.subjectId);
    }

    const q = await Question.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      update,
      { new: true, runValidators: true }
    );

    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);

  } catch (err) {
    console.error('updateQuestion error:', err.name, err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/questions/:id ─────────────────────
const deleteQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const q = await Question.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!q) return res.status(404).json({ error: 'Question not found' });

    res.json({ deleted: true, id: req.params.id });

  } catch (err) {
    console.error('deleteQuestion error:', err.name, err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getQuestion,
  getChapters,
  getQuestionById,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
};