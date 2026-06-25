const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { validate, contactValidators } = require('../middleware/validate');

router.post('/', contactValidators, validate, async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    await Contact.create({ name, email, message, phone });
    res.status(201).json({ message: 'Message received! We will reply within 24 hours.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting message' });
  }
});

module.exports = router;
