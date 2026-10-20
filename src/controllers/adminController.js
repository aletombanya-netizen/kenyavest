const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const { sendWithdrawalUpdateEmail, sendDepositApprovedEmail, sendReferralBonusEmail } = require('../services/emailService');
const crypto = require('crypto');

// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route GET /api/admin/transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route PUT /api/admin/transactions/:id
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['completed', 'rejected', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const transaction = await Transaction.findById(req.params.id).populate('user', 'name phone email');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction has already been processed' });
    }

    const user = await User.findById(transaction.user._id || transaction.user);

    // ── Withdrawal approval/rejection ────────────────────────────
    if (transaction.type === 'withdrawal') {
      if (status === 'completed') {
        // Balance was already reserved on withdrawal request — nothing to deduct
        transaction.status = 'completed';
      } else {
        // Rejected — restore the reserved balance
        if (user) {
          user.balance += Number(transaction.amount);
          await user.save();
        }
        transaction.status = 'rejected';
      }
      await transaction.save();

      // Send email notification
      if (user?.email) {
        sendWithdrawalUpdateEmail(user, transaction.amount, transaction.status).catch(() => {});
      }

      return res.json({ message: 'Withdrawal updated successfully', transaction });
    }

    // ── Manual deposit approval ───────────────────────────────────
    if (transaction.type === 'deposit') {
      if (status === 'completed' && user) {
        user.balance += Number(transaction.amount);
        user.accumulatedDeposits = (user.accumulatedDeposits || 0) + Number(transaction.amount);
        
        // ── Referral Bonus (first deposit only) ───────────────
        if (!user.hasDeposited && user.referredBy) {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            const bonus = Math.floor(transaction.amount * 0.10);
            referrer.balance += bonus;
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
              sendReferralBonusEmail(referrer, bonus, user.name).catch(() => {});
            }
          }
        }
        
        user.hasDeposited = true;
        await user.save();
        transaction.status = 'completed';
        
        // Send deposit approved email
        if (user.email) {
          sendDepositApprovedEmail(user, transaction.amount).catch(() => {});
        }
        
      } else {
        transaction.status = 'rejected';
      }
      await transaction.save();
      return res.json({ message: 'Deposit updated successfully', transaction });
    }

    res.status(400).json({ message: 'This transaction type cannot be manually updated' });
  } catch (error) {
    console.error('[Admin TX Update]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route PUT /api/admin/users/:id/balance
const updateUserBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.balance = Number(balance);
    await user.save();
    res.json({ message: 'Balance updated', balance: user.balance });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route GET /api/admin/contacts
const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route PUT /api/admin/users/:id/ban
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot ban an admin' });
    
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const Investment = require('../models/Investment');
const Setting = require('../models/Setting');

// @route PUT /api/admin/settings
// @desc Update global settings (e.g. WhatsApp number)
// @access Private/Admin
const updateSettings = async (req, res) => {
  try {
    const updates = req.body; // e.g. { whatsappNumber: '254700123456' }
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[Admin Settings Error]', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

// ── Client Package Management ─────────────────────────────────────

// @route GET /api/admin/users/:id/investments
const getUserInvestmentsAdmin = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client packages' });
  }
};

// @route POST /api/admin/users/:id/investments
// @desc Assign new investment package or update an existing one
const assignOrUpdateUserInvestment = async (req, res) => {
  try {
    const { investmentId, planName, amountInvested, dailyReturn, durationDays, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (investmentId) {
      // Edit existing package
      const inv = await Investment.findById(investmentId);
      if (!inv) return res.status(404).json({ message: 'Investment package not found' });
      if (planName) inv.planName = planName;
      if (amountInvested !== undefined) inv.amountInvested = Number(amountInvested);
      if (dailyReturn !== undefined) inv.dailyReturn = Number(dailyReturn);
      if (durationDays !== undefined) inv.durationDays = Number(durationDays);
      if (status) inv.status = status;
      await inv.save();
      return res.json({ message: 'Investment package updated successfully', investment: inv });
    }

    // Assign new package directly to client
    const days = Number(durationDays) || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const newInv = await Investment.create({
      user: user._id,
      planName: planName || 'Custom Plan',
      amountInvested: Number(amountInvested) || 0,
      dailyReturn: Number(dailyReturn) || 0,
      durationDays: days,
      endDate,
      status: status || 'active',
    });

    res.status(201).json({ message: 'Investment package assigned successfully', investment: newInv });
  } catch (error) {
    console.error('[Admin Assign Package Error]', error);
    res.status(500).json({ message: 'Error saving package for user' });
  }
};

// @route DELETE /api/admin/investments/:id
const cancelUserInvestment = async (req, res) => {
  try {
    const inv = await Investment.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Investment not found' });
    inv.status = 'cancelled';
    await inv.save();
    res.json({ message: 'Package cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling investment' });
  }
};

module.exports = {
  getAllUsers,
  getAllTransactions,
  updateTransactionStatus,
  updateUserBalance,
  getContactMessages,
  toggleUserBan,
  updateSettings,
  getUserInvestmentsAdmin,
  assignOrUpdateUserInvestment,
  cancelUserInvestment,
};
