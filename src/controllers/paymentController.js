const Transaction = require('../models/Transaction');
const User = require('../models/User');
const payhero = require('../services/payhero');
const crypto = require('crypto');

// @desc    Initiate M-Pesa Deposit via Payhero
// @route   POST /api/payments/deposit
// @access  Private
const initiateDeposit = async (req, res) => {
  try {
    const { amount, phone } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ message: 'Amount must be at least KES 10' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate unique reference
    const reference = `KV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create pending transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type: 'deposit',
      status: 'pending',
      reference,
      phone,
    });

    // Initiate STK Push
    const payheroResponse = await payhero.initiateSTKPush(amount, phone, reference);

    res.status(200).json({
      message: 'M-Pesa STK push initiated successfully. Please enter your PIN on your phone.',
      reference,
      payheroResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error during deposit' });
  }
};

// @desc    Payhero Webhook Callback
// @route   POST /api/payments/callback
// @access  Public
const payheroCallback = async (req, res) => {
  try {
    const data = req.body;
    console.log('Payhero Callback Received:', data);

    // Ensure it's a successful response from Payhero
    if (data && data.response && data.response.Success) {
      const reference = data.response.CheckoutRequestID; // Or ExternalReference depending on Payhero response structure
      const amount = data.response.Amount;
      const mpesaReceiptNumber = data.response.MpesaReceiptNumber;

      // Find the pending transaction
      // Note: Adapt reference logic based on exact Payhero callback payload for external_reference
      const transaction = await Transaction.findOne({ reference: data.response.ExternalReference });

      if (transaction && transaction.status === 'pending') {
        // Update transaction status
        transaction.status = 'success';
        transaction.mpesaReceiptNumber = mpesaReceiptNumber;
        await transaction.save();

        // Update user balance
        const user = await User.findById(transaction.user);
        if (user) {
          user.balance += Number(transaction.amount);
          await user.save();
        }
      }
    } else if (data && data.response && !data.response.Success) {
        // Handle failed transaction
        const transaction = await Transaction.findOne({ reference: data.response.ExternalReference });
        if (transaction && transaction.status === 'pending') {
            transaction.status = 'failed';
            await transaction.save();
        }
    }

    // Always return 200 OK to acknowledge receipt to Payhero
    res.status(200).send('OK');
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).send('Server Error');
  }
};

// @desc    Get user transactions
// @route   GET /api/payments/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  initiateDeposit,
  payheroCallback,
  getTransactions,
};
