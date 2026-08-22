const { runSubscriptionStatusCheck } = require('../services/subscriptionService');

/**
 * Manually trigger subscription status checks.
 * POST /api/admin/subscriptions/check-status
 */
async function triggerStatusCheck(req, res) {
  try {
    const results = await runSubscriptionStatusCheck();
    return res.json({
      message: 'Automatic subscription status check completed successfully.',
      results
    });
  } catch (err) {
    console.error('[AdminSubscriptionController] Error during manual status check:', err.message);
    return res.status(500).json({ error: 'Failed to run subscription status check.' });
  }
}

module.exports = {
  triggerStatusCheck
};
