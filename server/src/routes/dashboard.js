const express = require('express');
const {
  getStats,
  getCharts,
  getRecentPayments,
  getRecentComplaints,
  getNetworkStatus
} = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce auth & admin constraints on all dashboard operations
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard routes
router.get('/stats', getStats);
router.get('/charts', getCharts);
router.get('/recent-payments', getRecentPayments);
router.get('/recent-complaints', getRecentComplaints);
router.get('/network', getNetworkStatus);

module.exports = router;
