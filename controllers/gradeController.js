const Grade = require('../models/Grade');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const listGradesForStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { year } = req.query;
    const q = schoolFilter(req, { studentId });
    if(year){
      const y = parseInt(year,10);
      if(!isNaN(y)){
        const start = new Date(y,0,1);
        const end = new Date(y+1,0,1);
        q.createdAt = { $gte: start, $lt: end };
      }
    }
    const grades = await Grade.find(q).sort({ createdAt: -1 });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addGradeForStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { subject, marks, total, type = 'Exam' } = req.body;
    if (!subject || marks == null || total == null) return res.status(400).json({ error: 'subject, marks and total required' });
    const g = new Grade({ schoolId: req.user.schoolId, studentId, subject, marks, total, type });
    await g.save();
    res.status(201).json(g);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const listGradesByClass = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ error: 'classId is required' });
    const grades = await Grade.find(schoolFilter(req)).sort({ createdAt: -1 });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listGradesForStudent,
  addGradeForStudent,
  listGradesByClass
};
