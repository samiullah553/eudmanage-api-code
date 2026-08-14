const mongoose = require('mongoose');

const hostelRoomSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  block: { type: String, trim: true, default: '' },
  roomNumber: { type: String, trim: true, required: true },
  type: { type: String, enum: ['Single', 'Double', 'Triple', 'Quad', 'Dorm'], default: 'Single' },
  capacity: { type: Number, default: 1, min: 1 },
  occupants: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'], default: 'Available' },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

hostelRoomSchema.index(
  { schoolId: 1, block: 1, roomNumber: 1 },
  { unique: true, name: 'school_block_room_unique' }
);

hostelRoomSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('HostelRoom', hostelRoomSchema);
