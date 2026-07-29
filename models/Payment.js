const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash','Cheque','Card','BankTransfer','Gateway'], default: 'Gateway' },
  gatewayRef: String,
  status: { type: String, enum: ['Pending','Completed','Failed','Reversed'], default: 'Completed' },
  paidAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
