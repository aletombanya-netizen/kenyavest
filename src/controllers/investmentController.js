const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Investment plans configuration
const PLANS = {
  starter:        { name: 'Starter',        dailyReturnRate: 0.30, minAmount: 500,    maxAmount: 4999,     durationDays: 30 },
  pro:            { name: 'Pro',            dailyReturnRate: 0.40, minAmount: 5000,   maxAmount: 19999,    durationDays: 30 },
  christmas_star: { name: 'Christmas Star', dailyReturnRate: 0.60, minAmount: 20000,  maxAmount: 49999,    durationDays: 30 },
  premium:        { name: 'Premium',        dailyReturnRate: 0.70, minAmount: 50000,  maxAmount: 99999,    durationDays: 30 },
  vip:            { name: 'VIP',            dailyReturnRate: 0.80, minAmount: 100000, maxAmount: 249999,   durationDays: 30 },
  elite:          { name: 'Elite',          dailyReturnRate: 0.90, minAmount: 250000, maxAmount: Infinity, durationDays: 30 },
};

// @desc    Create a new investment
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
  try {
    const { planKey, amount } = req.body;
    const plan = PLANS[planKey];

    if (!plan) {
      return res.status(400).json({ message: 'Invalid investment plan selected' });
    }

    const investAmount = Number(amount);

    if (investAmount < plan.minAmount) {
      return res.status(400).json({ message: `Minimum amount for ${plan.name} plan is KES ${plan.minAmount.toLocaleString()}` });
    }
    if (investAmount > plan.maxAmount) {
      return res.status(400).json({ message: `Maximum amount for ${plan.name} plan is KES ${plan.maxAmount.toLocaleString()}` });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.balance < investAmount) {
      return res.status(400).json({ message: 'Insufficient balance. Please deposit funds first.' });
    }

    // Deduct amount from user balance
    user.balance -= investAmount;
    await user.save();

    const dailyReturn = parseFloat((investAmount * plan.dailyReturnRate).toFixed(2));

    // Calculate End Date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create the investment
    const investment = await Investment.create({
      user: user._id,
      planName: plan.name,
      amountInvested: investAmount,
      dailyReturn,
      status: 'active',
      durationDays: plan.durationDays,
      endDate: endDate,
    });

    // Log a transaction for this investment
    await Transaction.create({
      user: user._id,
      amount: investAmount,
      type: 'investment',
      status: 'completed',
      reference: `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    });

    res.status(201).json({
      message: `${plan.name} plan activated! You'll earn KES ${dailyReturn}/day.`,
      investment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating investment' });
  }
};

// @desc    Get user's investments
// @route   GET /api/investments
// @access  Private
const getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching investments' });
  }
};

module.exports = { createInvestment, getUserInvestments };
