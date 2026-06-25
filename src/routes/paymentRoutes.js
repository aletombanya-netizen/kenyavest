const express = require('express');
const router = express.Router();
const { initiateDeposit, payheroCallback, getTransactions, requestWithdrawal } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/deposit', protect, initiateDeposit);
router.post('/withdraw', protect, requestWithdrawal);
router.post('/callback', payheroCallback); // Webhook callback is public
router.get('/transactions', protect, getTransactions);

module.exports = router;
