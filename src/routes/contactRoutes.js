const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    await Contact.create({ name, email, message });
    res.status(201).json({ message: 'Message received! We will reply within 24 hours.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting message' });
  }
});

module.exports = router;
