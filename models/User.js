const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], default: 'student' },
  name: { type: String, trim: true }
  ,enrolledQuran: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ email: 1, schoolId: 1 }, { unique: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);