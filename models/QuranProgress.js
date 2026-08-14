const mongoose = require('mongoose');

const QuranProgressSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'QuranCourse', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'QuranLesson', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playedSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  score: { type: Number, default: 0 },
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

QuranProgressSchema.index({ user: 1, course: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('QuranProgress', QuranProgressSchema);
