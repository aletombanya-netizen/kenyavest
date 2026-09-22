const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, price, totalSeats, date } = req.body;

    const event = new Event({
      title,
      description,
      price,
      totalSeats,
      availableSeats: totalSeats,
      date,
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public or Private/Admin depending on needs (making it accessible to users so they can see events, but admin can manage)
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const { title, description, price, totalSeats, date } = req.body;

    const event = await Event.findById(req.params.id);

    if (event) {
      event.title = title || event.title;
      event.description = description || event.description;
      event.price = price !== undefined ? price : event.price;
      
      if (totalSeats !== undefined) {
        // adjust availableSeats based on the change in totalSeats
        const diff = totalSeats - event.totalSeats;
        event.totalSeats = totalSeats;
        event.availableSeats = event.availableSeats + diff;
      }
      
      event.date = date || event.date;

      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      await event.deleteOne();
      res.json({ message: 'Event removed' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a seat to a user
// @route   POST /api/events/:id/assign
// @access  Private/Admin
const assignSeat = async (req, res) => {
  try {
    const { userId, seatNumber } = req.body;

    const event = await Event.findById(req.params.id);
    const user = await User.findById(userId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'No available seats left' });
    }

    // Check if user is already assigned a seat
    const alreadyAssigned = event.assignedSeats.find(
      (seat) => seat.user.toString() === userId.toString()
    );

    if (alreadyAssigned) {
      return res.status(400).json({ message: 'User is already assigned a seat' });
    }

    // Check if seatNumber is taken
    const seatTaken = event.assignedSeats.find(
      (seat) => seat.seatNumber === seatNumber
    );
    if (seatTaken) {
      return res.status(400).json({ message: 'Seat number already taken' });
    }

    event.assignedSeats.push({ user: userId, seatNumber });
    event.availableSeats -= 1;

    await event.save();
    res.status(201).json({ message: 'Seat assigned successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  assignSeat,
};
