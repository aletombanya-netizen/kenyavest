const cron = require('node-cron');
const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendROICreditEmail } = require('./emailService');
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
      const now = new Date();

      let credited = 0;
      let completed = 0;
      
      for (const investment of activeInvestments) {
        const user = await User.findById(investment.user);
        if (!user) continue;

        // Check if investment is completed
        if (investment.endDate && now >= investment.endDate) {
          // Return Capital
          user.balance += investment.amountInvested;
          investment.status = 'completed';
          investment.isCapitalReturned = true;
          
          await Transaction.create({
            user: user._id,
            amount: investment.amountInvested,
            type: 'capital_return',
            status: 'completed',
            reference: `RET-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            description: `Capital return for ${investment.planName} plan`,
          });
          
          await investment.save();
          await user.save();
          completed++;
        } else {
          // Distribute daily ROI
          user.balance += investment.dailyReturn;
          
          await Transaction.create({
            user: user._id,
            amount: investment.dailyReturn,
            type: 'roi',
            status: 'completed',
            reference: `ROI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            description: `Daily ROI from ${investment.planName} plan`,
          });
          
          await user.save();

          // Email notification (non-blocking)
          if (user.email) sendROICreditEmail(user, investment.dailyReturn).catch(() => {});
          credited++;
        }
      }

      console.log(`[CRON] ROI distributed: ${credited} | Packages completed: ${completed}`);
    } catch (error) {
      console.error('[CRON] Error during ROI distribution:', error.message);
    }
  });

  console.log('[CRON] Daily ROI cron job scheduled (runs at midnight).');
};

module.exports = { startDailyROICron };
