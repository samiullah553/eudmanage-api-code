const mongoose = require('mongoose');

const feeItemSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true, default: 0 },
  // Frequency options expanded to cover quarterly and half-yearly;
  // keep legacy 'One-time' value for compatibility
  frequency: { type: String, enum: ['One-time','One-Time', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], default: 'One-time' },
  // Category / type of fee (Admission, Tuition, Exam, Annual, Computer, Hostel, Custom)
  category: { type: String, enum: ['Admission','Tuition','Exam','Annual','Computer','Hostel','Custom'], default: 'Tuition' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeeItem', feeItemSchema);
