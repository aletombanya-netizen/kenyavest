const cron = require('node-cron');
const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

/**
 * Runs daily at midnight (00:00) server time.
 * Credits every active investment's dailyReturn to the user's balance.
 */
const startDailyROICron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily ROI distribution...');
    try {
      const activeInvestments = await Investment.find({ status: 'active' });

      let credited = 0;
      for (const investment of activeInvestments) {
        const user = await User.findById(investment.user);
        if (!user) continue;

        user.balance += investment.dailyReturn;
        await user.save();

        // Log ROI as a transaction
        await Transaction.create({
          user: user._id,
          amount: investment.dailyReturn,
          type: 'roi',
          status: 'success',
          reference: `ROI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        });

        credited++;
      }

      console.log(`[CRON] ROI distributed to ${credited} investments.`);
    } catch (error) {
      console.error('[CRON] Error during ROI distribution:', error.message);
    }
  });

  console.log('[CRON] Daily ROI cron job scheduled (runs at midnight).');
};

module.exports = { startDailyROICron };
