const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  fname: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lname: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  empId: {
    type: String,
    required: [true, 'Employee ID is required'],
    trim: true
  },
  department: {
    type: String,
    // required: [true, 'Department is required'],
    trim: true
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  experienceYrs: {
    type: Number,
    // required: [true, 'Experience in years is required'],
    min: [0, 'Experience cannot be negative']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  monthlySalary: {
    type: Number,
    required: [true, 'Monthly salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  joinDate: {
    type: Date,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Active', 'Inactive', 'Suspended', 'On Leave'],
    default: 'Active'
  },
  subjects: [{
    type: String,
    trim: true
  }],
}, {
  timestamps: true
});

// Ensure unique indexes ignore missing/null values to avoid duplicate-null errors
TeacherSchema.index({ schoolId: 1, empId: 1 }, { unique: true, sparse: true, name: 'school_empId_1' });
TeacherSchema.index({ schoolId: 1, email: 1 }, { unique: true, sparse: true, name: 'school_email_1' });

module.exports = mongoose.model('Teacher', TeacherSchema);
