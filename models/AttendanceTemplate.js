const mongoose = require('mongoose');

const attendanceTemplateSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  entries: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['P', 'A', 'L', 'E', 'H', 'O'], default: 'P' },
    reason: { type: String, enum: ['None', 'Sick', 'Leave', 'Remote', 'Personal', 'Other'], default: 'None' },
    remarks: { type: String, trim: true, default: '' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

attendanceTemplateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AttendanceTemplate', attendanceTemplateSchema);
