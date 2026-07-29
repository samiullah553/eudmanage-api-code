const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: [true, 'Subject name is required'], trim: true },
  code: { type: String, trim: true },
  dept: { type: String, trim: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  credits: { type: Number, default: 3, min: [0, 'Credits cannot be negative'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', SubjectSchema);
