const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  slot: { type: Number, required: true, min: 1 },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  institutionType: {
    type: String,
    enum: ['School', 'College', 'Islamic School'],
    default: 'School'
  },
  sessionType: {
    type: String,
    enum: ['Regular', 'Lecture', 'Lab', 'Islamic Studies', 'Prayer', 'Break', 'Exam', 'Activity'],
    default: 'Regular'
  },
  periodName: { type: String, trim: true },
  startTime: { type: String, trim: true },
  endTime: { type: String, trim: true },
  room: { type: String, trim: true },
  note: { type: String, trim: true },
  isBreak: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TimetableSchema.index({ classId: 1, dayOfWeek: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
