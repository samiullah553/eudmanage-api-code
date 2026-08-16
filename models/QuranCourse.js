const mongoose = require('mongoose');

const QuranCourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, index: true },
  description: { type: String },
  shortDescription: { type: String },
  level: { type: String, default: 'Beginner' },
  levels: [{ type: String }],
  category: { type: String },
  tags: [{ type: String }],
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  coverUrl: { type: String },
  coverImage: { type: String },
  lessonCount: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

QuranCourseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('QuranCourse', QuranCourseSchema);
