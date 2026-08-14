const HostelRoom = require('../models/HostelRoom');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const getRooms = async (req, res) => {
  try {
    const rooms = await HostelRoom.find(schoolFilter(req)).sort({ block: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await HostelRoom.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!room) return res.status(404).json({ error: 'Hostel room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, block, type, capacity, occupants, status, notes } = req.body;
    if (!roomNumber) {
      return res.status(400).json({ error: 'Room number is required' });
    }

    const payload = {
      schoolId: req.user.schoolId,
      roomNumber: roomNumber.trim(),
      block: block ? block.trim() : '',
      type: type || 'Single',
      capacity: Number(capacity) || 1,
      occupants: Number(occupants) || 0,
      status: status || 'Available',
      notes: notes ? notes.trim() : ''
    };

    const room = new HostelRoom(payload);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error('createRoom error', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ error: 'A room with that block and number already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const updates = {
      block: req.body.block ? req.body.block.trim() : undefined,
      roomNumber: req.body.roomNumber ? req.body.roomNumber.trim() : undefined,
      type: req.body.type,
      capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : undefined,
      occupants: req.body.occupants !== undefined ? Number(req.body.occupants) : undefined,
      status: req.body.status,
      notes: req.body.notes ? req.body.notes.trim() : undefined,
      updatedAt: Date.now()
    };

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const room = await HostelRoom.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      updates,
      { new: true }
    );

    if (!room) return res.status(404).json({ error: 'Hostel room not found' });
    res.json(room);
  } catch (err) {
    console.error('updateRoom error', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ error: 'A room with that block and number already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!room) return res.status(404).json({ error: 'Hostel room not found' });
    res.json({ message: 'Hostel room deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
