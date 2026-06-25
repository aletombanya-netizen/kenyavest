const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({}).populate('user', 'name phone').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update transaction status (Approve/Reject)
// @route   PUT /api/admin/transactions/:id
// @access  Private/Admin
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Process logic for withdrawals
    if (transaction.type === 'withdrawal' && transaction.status === 'pending') {
      if (status === 'success') {
        const user = await User.findById(transaction.user);
        if (!user || user.balance < transaction.amount) {
           return res.status(400).json({ message: 'User does not have enough balance' });
        }
        // Deduct balance
        user.balance -= transaction.amount;
        await user.save();
        transaction.status = 'success';
      } else if (status === 'failed' || status === 'rejected') {
        transaction.status = 'failed';
      } else {
         return res.status(400).json({ message: 'Invalid status' });
      }
      await transaction.save();
      return res.json({ message: 'Transaction updated successfully', transaction });
    }

    // Process logic for manual deposits if any
    if (transaction.type === 'deposit' && transaction.status === 'pending') {
       if (status === 'success') {
         const user = await User.findById(transaction.user);
         user.balance += transaction.amount;
         await user.save();
         transaction.status = 'success';
       } else if (status === 'failed' || status === 'rejected') {
         transaction.status = 'failed';
       } else {
         return res.status(400).json({ message: 'Invalid status' });
       }
       await transaction.save();
       return res.json({ message: 'Transaction updated successfully', transaction });
    }

    res.status(400).json({ message: 'Transaction cannot be updated' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user balance manually
// @route   PUT /api/admin/users/:id/balance
// @access  Private/Admin
const updateUserBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
      user.balance = Number(balance);
      await user.save();
      res.json({ message: 'Balance updated', balance: user.balance });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all contact messages
// @route   GET /api/admin/contacts
// @access  Private/Admin
const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getAllTransactions,
  updateTransactionStatus,
  updateUserBalance,
  getContactMessages,
};
