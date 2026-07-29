// backend/models/Student.js
const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String,
  email: String
}, { _id: false });

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String },
  type: String,
  notes: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  roll: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  parent: String,
  parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  contact: String,
  email: String,
  dob: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  fee: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated'], default: 'Active' },
  enrollmentStatus: { type: String, enum: ['Pending', 'Admitted', 'Active', 'Graduated', 'Left'], default: 'Pending' },
  admissionDate: { type: Date, default: null },
  studentId: { type: String, trim: true },
  blood: String,
  addr: String,
  photoUrl: String,
  emergencyContacts: [emergencyContactSchema],
  medical: {
    allergies: String,
    conditions: String,
    notes: String
  },
  documents: [documentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for historical queries and fast lookups
studentSchema.index({ schoolId: 1, createdAt: -1 });
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, classId: 1, roll: 1 }, { unique: true, name: 'school_class_roll_1' });

studentSchema.pre('save', function () {
  // synchronous pre-save hook: update timestamp
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Student', studentSchema);