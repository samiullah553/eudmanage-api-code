const mongoose = require('mongoose');

const EnrollmentRequestSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  dob: { type: String },
  gender: { type: String },
  guardian: { type: String },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String },
  prevLevel: { type: String },
  classType: { type: String },
  photoPath: { type: String },
  documentPaths: [String],
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('EnrollmentRequest', EnrollmentRequestSchema);
