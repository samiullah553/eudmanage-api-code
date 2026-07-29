const Attendance = require('../models/Attendance');
const AttendanceTemplate = require('../models/AttendanceTemplate');
const Student = require('../models/Student');
const Class = require('../models/Class');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const normalizeAttendanceStatus = (status) => {
  const value = (status || 'P').toString().toUpperCase();
  return ['P', 'A', 'L', 'E', 'H', 'O'].includes(value) ? value : 'P';
};

// Helper to normalize incoming date strings to start-of-day Date object
function normalizeDay(d){
  if(!d) return null;
  if(typeof d === 'string' && /^\d{4}$/.test(d)) return d; // keep year string separately
  const dt = new Date(d);
  dt.setHours(0,0,0,0);
  return dt;
}

function normalizeRange(start, end) {
  const range = {};
  if (start) {
    const from = new Date(start);
    from.setHours(0,0,0,0);
    range.$gte = from;
  }
  if (end) {
    const to = new Date(end);
    to.setHours(23,59,59,999);
    range.$lte = to;
  }
  return Object.keys(range).length ? range : null;
}

const getAttendance = async (req, res) => {
  try {
    const { date, classId, studentId, year, startDate, endDate } = req.query;
    const q = schoolFilter(req);
    if (classId) q.classId = classId;
    if (studentId) q.studentId = studentId;

    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        q.date = { $gte: start, $lt: end };
      }
    } else if (startDate || endDate) {
      const range = normalizeRange(startDate, endDate);
      if (range) q.date = range;
    } else if (date) {
      const nd = normalizeDay(date);
      if (nd) q.date = nd;
    }

    const records = await Attendance.find(q).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const createAttendance = async (req, res) => {
  try {
    const {date, classId, studentId, status, remarks, reason = 'None'} = req.body;
    if(!date || !studentId) return res.status(400).json({ error: 'date and studentId required' });
    const nd = normalizeDay(date);
    const normalizedStatus = normalizeAttendanceStatus(status);
    // look for existing record for that student & date
    const record = await Attendance.findOne({ schoolId: req.user.schoolId, date: nd, studentId });
    if(record) {
      record.status = normalizedStatus;
      record.remarks = remarks;
      record.reason = reason;
      record.updatedAt = new Date();
      await record.save();
      return res.json(record);
    }

    const rec = new Attendance({ schoolId: req.user.schoolId, date: nd, classId, studentId, status: normalizedStatus, remarks, reason });
    await rec.save();
    res.status(201).json(rec);
  } catch(err) {
    res.status(400).json({error: err.message});
  }
};



const deleteAttendance = async (req, res) => {
  try {
    await Attendance.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    res.json({message: 'Deleted'});
  } catch(err) {
    res.status(400).json({error: err.message});
  }
};

const bulkCreateAttendance = async (req, res) => {
  try {
    const { date, classId, absences } = req.body;
    if (!date || !classId || !Array.isArray(absences)) {
      return res.status(400).json({ error: 'Missing date, classId, or absences array' });
    }
    const nd = normalizeDay(date);
    const results = [];
    for (const absence of absences) {
      const { studentId, status = 'A', reason = 'None', remarks = '' } = absence;
      const normalizedStatus = normalizeAttendanceStatus(status);
      let record = await Attendance.findOne({ schoolId: req.user.schoolId, date: nd, studentId });
      if (record) {
        record.status = normalizedStatus;
        record.reason = reason;
        record.remarks = remarks;
        record.updatedAt = new Date();
        await record.save();
      } else {
        record = new Attendance({ schoolId: req.user.schoolId, date: nd, classId, studentId, status: normalizedStatus, reason, remarks });
        await record.save();
      }
      results.push(record);
    }
    
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { year } = req.query;
    if (!studentId) return res.status(400).json({ error: 'student id required' });
    const q = schoolFilter(req, { studentId });
    if(year){
      const y = parseInt(year,10);
      if(!isNaN(y)){
        const start = new Date(y,0,1);
        const end = new Date(y+1,0,1);
        q.date = { $gte: start, $lt: end };
      }
    }
    const total = await Attendance.countDocuments(q);
    const present = await Attendance.countDocuments({ ...q, status: 'P' });
    const absent = await Attendance.countDocuments({ ...q, status: 'A' });
    const late = await Attendance.countDocuments({ ...q, status: 'L' });
    const excused = await Attendance.countDocuments({ ...q, status: 'E' });
    const halfDay = await Attendance.countDocuments({ ...q, status: 'H' });
    const holiday = await Attendance.countDocuments({ ...q, status: 'O' });
    const rate = total > 0 ? Math.round((present / total) * 10000) / 100 : 0;

    const recent = await Attendance.find(q).sort({ date: -1 }).limit(30).select('date status reason remarks -_id');

    res.json({ total, present, absent, late, excused, halfDay, holiday, attendanceRatePercent: rate, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudentAttendanceHistory = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { year, startDate, endDate } = req.query;
    if (!studentId) return res.status(400).json({ error: 'student id required' });
    const q = schoolFilter(req, { studentId });
    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        q.date = { $gte: start, $lt: end };
      }
    } else if (startDate || endDate) {
      const range = normalizeRange(startDate, endDate);
      if (range) q.date = range;
    }
    const records = await Attendance.find(q).sort({ date: -1 }).select('date status reason remarks classId -_id');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAttendanceTemplates = async (req, res) => {
  try {
    const templates = await AttendanceTemplate.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAttendanceTemplate = async (req, res) => {
  try {
    const { name, classId, entries } = req.body;
    if (!name || !classId) return res.status(400).json({ error: 'name and classId are required' });
    const validatedEntries = Array.isArray(entries) ? entries.map(entry => ({
      studentId: entry.studentId,
      status: entry.status || 'P',
      reason: entry.reason || 'None',
      remarks: entry.remarks || ''
    })) : [];
    const template = new AttendanceTemplate({ schoolId: req.user.schoolId, name, classId, entries: validatedEntries });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteAttendanceTemplate = async (req, res) => {
  try {
    await AttendanceTemplate.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, year } = req.query;
    if (!classId) return res.status(400).json({ error: 'classId is required' });
    const q = schoolFilter(req, { classId });
    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        q.date = { $gte: start, $lt: end };
      }
    } else if (startDate || endDate) {
      const range = normalizeRange(startDate, endDate);
      if (range) q.date = range;
    }

    const records = await Attendance.find(q).populate('studentId', 'fname lname roll').sort({ date: -1 });
    const students = {};
    const dailyTotals = {};
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let halfDay = 0;
    let holiday = 0;

    for (const record of records) {
      const dateKey = record.date.toISOString().slice(0, 10);
      dailyTotals[dateKey] = dailyTotals[dateKey] || { present: 0, absent: 0, late: 0, excused: 0, halfDay: 0, holiday: 0, total: 0 };
      dailyTotals[dateKey].total += 1;
      const statusKey = record.status === 'P' ? 'present' : record.status === 'A' ? 'absent' : record.status === 'L' ? 'late' : record.status === 'E' ? 'excused' : record.status === 'H' ? 'halfDay' : 'holiday';
      dailyTotals[dateKey][statusKey] += 1;

      const studentIdStr = record.studentId && record.studentId._id ? record.studentId._id.toString() : record.studentId.toString();
      if (!students[studentIdStr]) {
        students[studentIdStr] = {
          studentId: studentIdStr,
          name: record.studentId ? `${record.studentId.fname || ''} ${record.studentId.lname || ''}`.trim() : 'Unknown',
          roll: record.studentId ? record.studentId.roll : '—',
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          halfDay: 0,
          holiday: 0,
          total: 0
        };
      }
      students[studentIdStr].total += 1;
      const studentStatusKey = record.status === 'P' ? 'present' : record.status === 'A' ? 'absent' : record.status === 'L' ? 'late' : record.status === 'E' ? 'excused' : record.status === 'H' ? 'halfDay' : 'holiday';
      students[studentIdStr][studentStatusKey] += 1;
      if (record.status === 'P') present += 1;
      else if (record.status === 'A') absent += 1;
      else if (record.status === 'L') late += 1;
      else if (record.status === 'E') excused += 1;
      else if (record.status === 'H') halfDay += 1;
      else if (record.status === 'O') holiday += 1;
    }

    const studentSummaries = Object.values(students).map(student => ({
      ...student,
      attendanceRatePercent: student.total > 0 ? Math.round((student.present / student.total) * 10000) / 100 : 0
    }));

    const totalRecords = records.length;
    const attendanceRatePercent = totalRecords > 0 ? Math.round((present / totalRecords) * 10000) / 100 : 0;
    res.json({ classId, totalRecords, present, absent, late, excused, halfDay, holiday, attendanceRatePercent, studentSummaries, dailyTotals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAttendance,
  createAttendance,
  deleteAttendance,
  bulkCreateAttendance,
  getStudentAttendanceSummary,
  getStudentAttendanceHistory,
  getAttendanceTemplates,
  createAttendanceTemplate,
  deleteAttendanceTemplate,
  getClassAttendanceReport
};