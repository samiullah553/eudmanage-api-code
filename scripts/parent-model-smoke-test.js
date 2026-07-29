const assert = require('assert');

try {
  require('../models/Parent');
  console.log('parent model load ok');
} catch (err) {
  console.error('parent model load failed:', err.message);
  process.exit(1);
}

try {
  const Student = require('../models/Student');
  const studentSchema = Student.schema.paths;
  assert.ok(studentSchema.parentIds, 'Student schema should define parentIds');
  console.log('student parentIds field ok');
} catch (err) {
  console.error('student parentIds check failed:', err.message);
  process.exit(1);
}
