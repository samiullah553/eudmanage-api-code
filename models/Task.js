const mongoose = require('mongoose');

// const taskSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: String,
//   type: { type: String, enum: ['Summer', 'Winter'], required: true },
//   classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
//   subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
//   subject: String, // fallback if subjectId not populated
//   dueDate: Date,
//   marks: { type: Number, default: 0 },
//   instructions: String,
//   attachments: [{
//     title: String,
//     url: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }],
//   // status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// taskSchema.index({ classId: 1, type: 1 });
// taskSchema.index({ dueDate: 1 });
// taskSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Task', taskSchema);



// Embedded question snapshot inside a task
const taskQuestionSchema = new mongoose.Schema({
  questionId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Question',
    required: false   // optional — in case question was deleted from bank
  },
  question:   { type: String, required: true },
  type:       { type: String, enum: ['mcq', 'short', 'long'] },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  marks:      { type: Number, default: 1 },
  options:    [String],
  answer:     String,
  chapter:    String,
  wordLimit:  Number,
}, { _id: false });  // ← no separate _id for embedded docs

const taskSchema = new mongoose.Schema({
  // ── Tenant / school scope ───────────────────────
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  // ── Core fields ────────────────────────────────
  title:       { type: String, required: true },
  description: String,

  // Summer or Winter assignment
  type: {
    type:     String,
    enum:     ['Summer', 'Winter'],
    required: true
  },

  // ── References ─────────────────────────────────
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subject:   String,  // fallback plain text

  // ── Assignment details ──────────────────────────
  dueDate:      Date,
  marks:        { type: Number, default: 0 },
  instructions: String,

  // ── Embedded questions ──────────────────────────
  questions: [taskQuestionSchema],

  // ── Attachments ─────────────────────────────────
  attachments: [{
    title:      String,
    url:        String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ── Status ──────────────────────────────────────
  status: {
    type:    String,
    enum:    ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.index({ classId: 1, type: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);