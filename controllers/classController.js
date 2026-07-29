const ClassModel = require('../models/Class');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getClasses = async (req, res) => {
  try {
    const q = schoolFilter(req);
    if (req.query.teacherId) q.classTeacher = req.query.teacherId;
    const classes = await ClassModel.find(q).populate('classTeacher');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getClass = async (req, res) => {
  try {
    const cls = await ClassModel.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('classTeacher');
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, section, year, classTeacher, capacity, room, fee, institutionType, academicLevel } = req.body;
    const cls = new ClassModel({
      name,
      section,
      year,
      classTeacher,
      capacity,
      room,
      fee,
      institutionType,
      academicLevel,
      schoolId: req.user.schoolId
    });
    await cls.save();
    res.json(cls);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const { name, section, year, classTeacher, capacity, room, fee, institutionType, academicLevel } = req.body;
    const cls = await ClassModel.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    cls.name = name !== undefined ? name : cls.name;
    cls.section = section !== undefined ? section : cls.section;
    cls.year = year !== undefined ? year : cls.year;
    cls.classTeacher = classTeacher !== undefined ? classTeacher : cls.classTeacher;
    cls.capacity = capacity !== undefined ? capacity : cls.capacity;
    cls.room = room !== undefined ? room : cls.room;
    cls.fee = fee !== undefined ? fee : cls.fee;
    cls.institutionType = institutionType !== undefined ? institutionType : cls.institutionType;
    cls.academicLevel = academicLevel !== undefined ? academicLevel : cls.academicLevel;
    cls.updatedAt = new Date();
    await cls.save();
    res.json(cls);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const cls = await ClassModel.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass
};
