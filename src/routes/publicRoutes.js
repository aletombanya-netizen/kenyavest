const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @route GET /api/public/recent-activity
// @desc  Get anonymized recent deposits and withdrawals for social proof popup
// @access Public
router.get('/recent-activity', async (req, res) => {
  try {
    // Fetch last 15 completed deposits and withdrawals
    const recentTxs = await Transaction.find({
      status: 'completed',
      type: { $in: ['deposit', 'withdrawal'] }
    })
      .sort({ updatedAt: -1 })
      .limit(15)
      .populate('user', 'name');

    // Randomize to avoid showing the exact same sequence always
    const shuffled = recentTxs.sort(() => 0.5 - Math.random()).slice(0, 5);

    const formatted = shuffled.map(tx => {
      // Anonymize name (e.g. "Benard A." instead of "Benard Aletombanya")
      let displayName = 'Someone';
      if (tx.user && tx.user.name) {
        const parts = tx.user.name.trim().split(' ');
        if (parts.length > 1) {
          displayName = `${parts[0]} ${parts[parts.length - 1][0]}.`;
        } else {
          displayName = parts[0];
        }
      }

      return {
        id: tx._id,
        name: displayName,
        type: tx.type,
        amount: tx.amount,
        timeAgo: Math.floor((Date.now() - new Date(tx.updatedAt).getTime()) / 60000) // minutes ago
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('[Public API Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
