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
const {
  listComplaints,
  getComplaintDetails,
  assignComplaint,
  changeStatus,
  addComment
} = require('../controllers/adminComplaintController');
const {
  listUsage,
  getCustomerUsageDetails,
  getUsageReport
} = require('../controllers/adminUsageController');
const {
  listPayments,
  getPaymentDetails,
  getBillPayments,
  recordPayment: recordAdminPayment
} = require('../controllers/adminPaymentController');
const { triggerStatusCheck } = require('../controllers/adminSubscriptionController');
const { createTask, listTasks, listWorkReports } = require('../controllers/adminTaskController');
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

// Complaint administration endpoints
router.get('/complaints', listComplaints);
router.get('/complaints/:id', getComplaintDetails);
router.patch('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/status', changeStatus);
router.post('/complaints/:id/updates', addComment);

// Usage Monitoring endpoints
router.get('/usage', listUsage);
router.get('/usage/customer/:customerId', getCustomerUsageDetails);
router.get('/usage/report', getUsageReport);

// Payments Management endpoints
router.get('/payments', listPayments);
router.get('/payments/:id', getPaymentDetails);
router.post('/payments', recordAdminPayment);
router.get('/bills/:billId/payments', getBillPayments);

// Subscriptions Management endpoints
router.post('/subscriptions/check-status', triggerStatusCheck);

// Technical Tasks endpoints
router.post('/tasks', createTask);
router.get('/tasks', listTasks);
router.get('/work-reports', listWorkReports);

module.exports = router;
