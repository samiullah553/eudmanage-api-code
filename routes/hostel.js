const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/hostelController');

const router = express.Router();

router.get('/rooms', getRooms);

router.post('/rooms', validate([
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('block').optional().trim(),
  body('type').optional().isIn(['Single', 'Double', 'Triple', 'Quad', 'Dorm']),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('occupants').optional().isInt({ min: 0 }).withMessage('Occupants must be a non-negative number'),
  body('status').optional().isIn(['Available', 'Occupied', 'Reserved', 'Maintenance'])
]), createRoom);

router.get('/rooms/:id', validate([
  param('id').isMongoId().withMessage('Invalid room ID')
]), getRoomById);

router.put('/rooms/:id', validate([
  param('id').isMongoId().withMessage('Invalid room ID'),
  body('roomNumber').optional().trim().notEmpty().withMessage('Room number cannot be empty'),
  body('block').optional().trim(),
  body('type').optional().isIn(['Single', 'Double', 'Triple', 'Quad', 'Dorm']),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('occupants').optional().isInt({ min: 0 }).withMessage('Occupants must be a non-negative number'),
  body('status').optional().isIn(['Available', 'Occupied', 'Reserved', 'Maintenance'])
]), updateRoom);

router.delete('/rooms/:id', validate([
  param('id').isMongoId().withMessage('Invalid room ID')
]), deleteRoom);

module.exports = router;
