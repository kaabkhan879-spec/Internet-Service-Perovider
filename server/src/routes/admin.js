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
const {
  listEmployees,
  getEmployeeDetails,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  changeEmployeePassword
} = require('../controllers/adminEmployeeController');
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

// Employee administration endpoints
router.get('/employees', listEmployees);
router.get('/employees/:id', getEmployeeDetails);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.patch('/employees/:id/status', toggleEmployeeStatus);
router.patch('/employees/:id/password', changeEmployeePassword);

module.exports = router;
