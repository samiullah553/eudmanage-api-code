const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeSchedule' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  items: [{ name: String, amount: Number }],
  amountDue: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  dueDate: Date,
  status: { type: String, enum: ['Pending','Paid','Partial','Overdue','Cancelled'], default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
