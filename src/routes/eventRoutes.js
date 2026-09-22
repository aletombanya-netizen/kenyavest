const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  assignSeat,
} = require('../controllers/eventController');

router.route('/')
  .get(getEvents)
  .post(protect, admin, createEvent);

router.route('/:id')
  .put(protect, admin, updateEvent)
  .delete(protect, admin, deleteEvent);

router.post('/:id/assign', protect, admin, assignSeat);

module.exports = router;
