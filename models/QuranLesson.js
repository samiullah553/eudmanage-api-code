const mongoose = require('mongoose');

const TranscriptSchema = new mongoose.Schema({
  start: { type: Number },
  end: { type: Number },
  text: { type: String },
  ayaIndex: { type: String }
}, { _id: false });

const TimestampSchema = new mongoose.Schema({
  start: Number,
  end: Number,
  label: String
}, { _id: false });

const ResourceSchema = new mongoose.Schema({
  type: String,
  url: String,
  meta: mongoose.Schema.Types.Mixed
}, { _id: false });

const QuranLessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'QuranCourse', required: true },
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  audioUrl: { type: String },
  videoUrl: { type: String },
  isPreview: { type: Boolean, default: false },
  transcript: [TranscriptSchema],
  translations: [{ lang: String, text: String }],
  timestamps: [TimestampSchema],
  resources: [ResourceSchema],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('QuranLesson', QuranLessonSchema);
