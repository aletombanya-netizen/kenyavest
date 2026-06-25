const express = require('express');
const router = express.Router();
const { createInvestment, getUserInvestments } = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createInvestment);
router.get('/', protect, getUserInvestments);

module.exports = router;
