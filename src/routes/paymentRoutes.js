const express = require('express');
const router = express.Router();
const { initiateDeposit, payheroCallback, getTransactions, requestWithdrawal } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate, depositValidators } = require('../middleware/validate');

router.post('/deposit',      protect, depositValidators, validate, initiateDeposit);
router.post('/withdraw',     protect, requestWithdrawal);
router.post('/callback',     payheroCallback); // Public webhook
router.get('/transactions',  protect, getTransactions);

module.exports = router;
