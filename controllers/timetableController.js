const Timetable = require('../models/Timetable');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getTimetables = async (req, res) => {
  try {
    const q = schoolFilter(req);
    if (req.query.classId) q.classId = req.query.classId;
    if (req.query.teacherId) q.teacherId = req.query.teacherId;
    if (req.query.dayOfWeek) q.dayOfWeek = Number(req.query.dayOfWeek);
    const timetables = await Timetable.find(q).populate('classId subjectId teacherId').sort({ dayOfWeek: 1, slot: 1 });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTimetable = async (req, res) => {
  try {
    const entry = await Timetable.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('classId subjectId teacherId');
    if (!entry) return res.status(404).json({ error: 'Timetable entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTimetable = async (req, res) => {
  try {
    const { classId, dayOfWeek, slot, subjectId, teacherId, institutionType, sessionType, periodName, startTime, endTime, room, note, isBreak } = req.body;
    const day = Number(dayOfWeek);
    const slotNum = Number(slot);
    if (!classId || !day || !slotNum) return res.status(400).json({ error: 'Class, dayOfWeek, and slot are required' });
    const entry = new Timetable({
      schoolId: req.user.schoolId,
      classId,
      dayOfWeek: day,
      slot: slotNum,
      subjectId,
      teacherId,
      institutionType,
      sessionType,
      periodName,
      startTime,
      endTime,
      room,
      note,
      isBreak: Boolean(isBreak)
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const entry = await Timetable.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!entry) return res.status(404).json({ error: 'Timetable entry not found' });
    const { classId, dayOfWeek, slot, subjectId, teacherId, institutionType, sessionType, periodName, startTime, endTime, room, note, isBreak } = req.body;
    entry.classId = classId !== undefined ? classId : entry.classId;
    entry.dayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) : entry.dayOfWeek;
    entry.slot = slot !== undefined ? Number(slot) : entry.slot;
    entry.subjectId = subjectId !== undefined ? subjectId : entry.subjectId;
    entry.teacherId = teacherId !== undefined ? teacherId : entry.teacherId;
    entry.institutionType = institutionType !== undefined ? institutionType : entry.institutionType;
    entry.sessionType = sessionType !== undefined ? sessionType : entry.sessionType;
    entry.periodName = periodName !== undefined ? periodName : entry.periodName;
    entry.startTime = startTime !== undefined ? startTime : entry.startTime;
    entry.endTime = endTime !== undefined ? endTime : entry.endTime;
    entry.room = room !== undefined ? room : entry.room;
    entry.note = note !== undefined ? note : entry.note;
    entry.isBreak = isBreak !== undefined ? Boolean(isBreak) : entry.isBreak;
    entry.updatedAt = new Date();
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    await Timetable.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable
};
