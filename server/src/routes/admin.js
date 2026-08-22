const express = require('express');
const {
  listPackages,
  createPackage,
  updatePackage,
  togglePackageStatus,
  assignSubscription
} = require('../controllers/adminPackageController');
const {
  listBills,
  getBillDetails,
  createBill,
  recordPayment
} = require('../controllers/adminBillingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce auth & admin validation filters for all admin endpoints
router.use(requireAuth);
router.use(requireAdmin);

// Package administration endpoints
router.get('/packages', listPackages);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.patch('/packages/:id/status', togglePackageStatus);

// Subscription assignments
router.post('/customers/:customerId/subscription', assignSubscription);

// Billing administration endpoints
router.get('/bills', listBills);
router.get('/bills/:id', getBillDetails);
router.post('/bills', createBill);
router.post('/bills/:id/payments', recordPayment);

module.exports = router;
