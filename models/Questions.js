// backend/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // ── Tenant / school scope ───────────────────────
  schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  // ── Classification ──────────────────────────────
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  chapter:   { type: String, required: true },

  // ── Question content ────────────────────────────
  type:       { type: String, enum: ['mcq', 'short', 'long'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  question:   { type: String, required: true },
  marks:      { type: Number, default: 1 },

  // MCQ specific
  options:    [String],          // ['A) ...', 'B) ...', 'C) ...', 'D) ...']
  answer:     String,            // correct answer or model answer

  wordLimit:  Number,            // for short/long questions
  topic:      String,            // optional sub-topic label

  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

// Fast lookups: class + subject + chapter is the main query path
questionSchema.index({ classId: 1, subjectId: 1, chapter: 1 });
questionSchema.index({ classId: 1, subjectId: 1, difficulty: 1 });
questionSchema.index({ type: 1 });

module.exports = mongoose.model('Question', questionSchema);