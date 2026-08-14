const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['link', 'file', 'youtube'], default: 'link' },
  title: { type: String, trim: true },
  url: { type: String, trim: true }
}, { _id: false });

const studyMaterialSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title: { type: String, required: true, trim: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  notes: { type: String, trim: true },
  resources: [resourceSchema],
  visibility: { type: String, enum: ['school','class','private'], default: 'school' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studyMaterialSchema.index({ schoolId: 1, subjectId: 1 });

studyMaterialSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
