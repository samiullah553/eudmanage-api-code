const School = require('../models/School');

const listSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const createSchool = async (req, res) => {
  try {
    const { name, code, address, contact, email, phone, logoUrl } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'School name and code are required' });

    const school = new School({ name, code, address, contact, email, phone, logoUrl });
    await school.save();
    res.status(201).json(school);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'School code already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  listSchools,
  getSchool,
  createSchool
};
