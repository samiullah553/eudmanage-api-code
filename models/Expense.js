const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true, default: 'General' },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  paidTo: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
