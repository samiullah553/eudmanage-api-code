const mongoose = require('mongoose');

const feeScheduleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  items: [{
    feeItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeItem' },
    name: String,
    amount: Number
  }],
  totalAmount: { type: Number, default: 0 },
  frequency: { type: String, enum: ['One-time','One-Time','Monthly','Quarterly','Half-Yearly','Yearly','Installments'], default: 'One-time' },
  category: { type: String, enum: ['Admission','Tuition','Exam','Annual','Computer','Hostel','Transport','Library','Sports','Custom'], default: 'Tuition' },
  isRecurring: { type: Boolean, default: false },
  recurrenceEndDate: Date,
  dueDate: Date,
  status: { type: String, enum: ['Draft','Active','Closed'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeeSchedule', feeScheduleSchema);
