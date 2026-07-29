const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  fname: { type: String, required: true, trim: true },
  lname: { type: String, required: true, trim: true },
  relationship: { type: String, trim: true, default: 'Guardian' },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  occupation: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  isPrimary: { type: Boolean, default: false },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

parentSchema.index({ schoolId: 1, email: 1 }, { unique: false });
parentSchema.index({ schoolId: 1, phone: 1 }, { unique: false });

parentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Parent', parentSchema);
