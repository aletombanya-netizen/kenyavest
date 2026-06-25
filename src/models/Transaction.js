const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'investment', 'roi', 'referral'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'rejected'],
      default: 'pending',
    },
    reference: {
      type: String,
      unique: true,
    },
    mpesaReceiptNumber: {
      type: String,
    },
    phone: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
