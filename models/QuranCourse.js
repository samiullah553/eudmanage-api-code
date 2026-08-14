const mongoose = require('mongoose');

const QuranCourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, index: true },
  description: { type: String },
  levels: [{ type: String }],
  tags: [{ type: String }],
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  coverUrl: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

QuranCourseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('QuranCourse', QuranCourseSchema);
