const mongoose = require('mongoose');

const investmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    planName: {
      type: String,
      required: true,
    },
    amountInvested: {
      type: Number,
      required: true,
    },
    dailyReturn: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 7,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCapitalReturned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
