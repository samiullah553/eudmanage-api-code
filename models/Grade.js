const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  type: { type: String, default: 'Exam' },
  marks: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for fast historical queries
gradeSchema.index({ studentId: 1, createdAt: -1 });
gradeSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
