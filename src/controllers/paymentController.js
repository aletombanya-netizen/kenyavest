const Transaction = require('../models/Transaction');
const User = require('../models/User');
const payhero = require('../services/payhero');
const { sendDepositConfirmation } = require('../services/emailService');
const crypto = require('crypto');

// ── Initiate Deposit ──────────────────────────────────────────────
// @route POST /api/payments/deposit
const initiateDeposit = async (req, res) => {
  try {
    const { amount, phone } = req.body;
    const reference = `KV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'deposit',
      status: 'pending',
      reference,
      phone,
    });

    const payheroResponse = await payhero.initiateSTKPush(amount, phone, reference);

    // Send deposit confirmation email (non-blocking)
    const user = await User.findById(req.user._id);
    if (user?.email) sendDepositConfirmation(user, amount).catch(() => {});

    res.status(200).json({
      message: 'M-Pesa STK push initiated. Please enter your PIN on your phone.',
      reference,
      payheroResponse,
    });
  } catch (error) {
    console.error('[Deposit Error]', error);
    res.status(500).json({ message: error.message || 'Server error during deposit' });
  }
};

// ── Payhero Callback ──────────────────────────────────────────────
// @route POST /api/payments/callback
const payheroCallback = async (req, res) => {
  try {
    const data = req.body;
    console.log('Payhero Callback:', JSON.stringify(data));

    const isSuccess = data?.response?.Success || data?.status === 'SUCCESS';
    const extRef    = data?.response?.ExternalReference || data?.external_reference;
    const amount    = data?.response?.Amount || data?.amount;
    const receipt   = data?.response?.MpesaReceiptNumber || data?.mpesa_receipt;

    if (isSuccess && extRef) {
      const transaction = await Transaction.findOne({ reference: extRef });
      if (transaction && transaction.status === 'pending') {
        transaction.status = 'completed';
        if (receipt) transaction.mpesaReceiptNumber = receipt;
        await transaction.save();

        // Credit user balance
        const user = await User.findById(transaction.user);
        if (user) {
          user.balance += Number(transaction.amount);
          user.accumulatedDeposits = (user.accumulatedDeposits || 0) + Number(transaction.amount);

          // ── Referral Bonus (first deposit only) ───────────────
          if (!user.hasDeposited && user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
              const bonus = Math.floor(transaction.amount * 0.10);
              referrer.balance         += bonus;
              referrer.referralEarnings += bonus;
              await referrer.save();

              await Transaction.create({
                user: referrer._id,
                amount: bonus,
                type: 'referral',
                status: 'completed',
                reference: `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                description: `Referral bonus from ${user.name}`,
              });
              // Send referral email
              if (referrer.email) {
                const { sendReferralBonusEmail } = require('../services/emailService');
                sendReferralBonusEmail(referrer, bonus, user.name).catch(() => {});
              }
            }
          }

          user.hasDeposited = true;
          await user.save();
        }
      }
    } else if (extRef) {
      // Payment failed/cancelled
      const transaction = await Transaction.findOne({ reference: extRef });
      if (transaction && transaction.status === 'pending') {
        transaction.status = 'failed';
        await transaction.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Callback Error]', error);
    res.status(500).send('Server Error');
  }
};

// ── Get Transactions ──────────────────────────────────────────────
// @route GET /api/payments/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── Request Withdrawal ────────────────────────────────────────────
// @route POST /api/payments/withdraw
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, phone } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is KES 50' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Reserve balance (deduct immediately, restore if rejected)
    user.balance -= amount;
    await user.save();

    const reference = `WD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const transaction = await Transaction.create({
      user: user._id,
      amount,
      type: 'withdrawal',
      status: 'pending',
      reference,
      phone: phone || user.phone,
    });

    res.status(200).json({
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      transaction,
    });
    
    // Notify all admins (non-blocking)
    try {
      const admins = await User.find({ role: 'admin' });
      const { sendNewWithdrawalAdminNotification } = require('../services/emailService');
      admins.forEach(admin => {
        if (admin.email) {
          sendNewWithdrawalAdminNotification(admin.email, user, amount, phone || user.phone).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }

  } catch (error) {
    console.error('[Withdrawal Error]', error);
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
};

module.exports = {
  initiateDeposit,
  payheroCallback,
  getTransactions,
  requestWithdrawal,
};
