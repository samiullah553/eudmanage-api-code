const mongoose = require('mongoose');

const QuranEnrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'QuranCourse', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['student','parent','auditor'], default: 'student' },
  status: { type: String, enum: ['active','cancelled','pending'], default: 'active' },
  paid: { type: Boolean, default: false },
  paymentInfo: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

QuranEnrollmentSchema.index({ course: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('QuranEnrollment', QuranEnrollmentSchema);
