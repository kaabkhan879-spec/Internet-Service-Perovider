const express = require('express');
const { employeeLogin, employeeProfile } = require('../controllers/employeeAuthController');
const {
  getAssignedComplaints,
  updateComplaintStatus,
  getAssignedTasks,
  updateTaskStatus,
  submitWorkReport,
  getWorkHistory,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  changePassword,
  updateProfile,
  getOperationsDashboardData,
  createCustomer,
  createTask,
  createComplaint,
  assignTechnician,
  getCustomerDetails,
  updateCustomer,
  toggleCustomerStatus,
  createPackage,
  updatePackage,
  togglePackageStatus,
  deletePackage
} = require('../controllers/employeePortalController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication endpoint
router.post('/login', employeeLogin);

// Enforce session check on portal endpoints
router.use(requireAuth);

// Profile endpoints
router.get('/profile', employeeProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

// Complaints endpoints
router.get('/complaints', getAssignedComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);

// Tasks endpoints
router.get('/tasks', getAssignedTasks);
router.put('/tasks/:id/status', updateTaskStatus);

// Work reports endpoint
router.post('/work-reports', submitWorkReport);

// Work history endpoint
router.get('/work-history', getWorkHistory);

// Operations Dashboard Data endpoint
router.get('/dashboard-stats', getOperationsDashboardData);
router.post('/customers', createCustomer);
router.post('/tasks', createTask);
router.post('/complaints', createComplaint);
router.post('/assign-technician', assignTechnician);
router.get('/customers/:id', getCustomerDetails);
router.put('/customers/:id', updateCustomer);
router.patch('/customers/:id/status', toggleCustomerStatus);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.patch('/packages/:id/status', togglePackageStatus);
router.delete('/packages/:id', deletePackage);

// Notifications endpoints
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadNotificationsCount);
router.post('/notifications/mark-read', markNotificationsAsRead);

module.exports = router;
