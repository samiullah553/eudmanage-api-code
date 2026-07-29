const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true },
  section: { type: String, default: 'A' },
  year: { type: String },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  capacity: { type: Number, default: 30 },
  room: { type: String, trim: true },
  fee: { type: Number, default: 0 },
  institutionType: {
    type: String,
    enum: ['School', 'College', 'Islamic School'],
    default: 'School'
  },
  academicLevel: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);
