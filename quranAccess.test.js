const assert = require('assert');
const { canUserAccessCourse, canUserAccessLesson } = require('./controllers/quranController');

const enrolled = [{ course: 'c1' }];

assert.strictEqual(canUserAccessCourse({ role: 'student', _id: 'u1' }, { _id: 'c1', isPublished: true }, enrolled), true);
assert.strictEqual(canUserAccessCourse({ role: 'student', _id: 'u2' }, { _id: 'c2', isPublished: false }, []), false);
assert.strictEqual(canUserAccessCourse({ role: 'teacher', _id: 't1' }, { _id: 'c2', isPublished: false }, []), true);
assert.strictEqual(canUserAccessLesson({ role: 'student', _id: 'u1' }, 'c1', enrolled), true);
assert.strictEqual(canUserAccessLesson({ role: 'student', _id: 'u2' }, 'c2', []), false);

console.log('quran access tests passed');
