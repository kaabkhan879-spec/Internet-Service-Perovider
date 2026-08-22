const cron = require('node-cron');
const { runSubscriptionStatusCheck } = require('../services/subscriptionService');

/**
 * Initializes background cron jobs.
 */
function startScheduler() {
  console.log('[Scheduler] Initializing background tasks...');

  // Run the subscription status check once every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily automatic subscription status check...');
    try {
      const results = await runSubscriptionStatusCheck();
      console.log('[Scheduler] Daily check completed successfully. Suspended:', results.suspended.length, 'Reactivated:', results.reactivated.length);
    } catch (err) {
      console.error('[Scheduler] Error during scheduled subscription status check:', err.message);
    }
  });
}

module.exports = {
  startScheduler
};
