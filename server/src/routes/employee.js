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
  getActivities,
  employeeLogout,
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
const { requireAuth, requireEmployee, requireTechnician } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication endpoint
router.post('/login', employeeLogin);

// Enforce session check on portal endpoints
router.use(requireAuth);

// Profile endpoints (shared by employee and technician)
router.get('/profile', employeeProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/activities', getActivities);
router.post('/logout', employeeLogout);

// Technician routes
router.get('/complaints', requireTechnician, getAssignedComplaints);
router.put('/complaints/:id/status', requireTechnician, updateComplaintStatus);
router.get('/tasks', requireTechnician, getAssignedTasks);
router.put('/tasks/:id/status', requireTechnician, updateTaskStatus);
router.post('/work-reports', requireTechnician, submitWorkReport);
router.get('/work-history', requireTechnician, getWorkHistory);

// Employee (Operations) routes
router.get('/dashboard-stats', requireEmployee, getOperationsDashboardData);
router.post('/customers', requireEmployee, createCustomer);
router.post('/tasks', requireEmployee, createTask);
router.post('/complaints', requireEmployee, createComplaint);
router.post('/assign-technician', requireEmployee, assignTechnician);
router.get('/customers/:id', requireEmployee, getCustomerDetails);
router.put('/customers/:id', requireEmployee, updateCustomer);
router.patch('/customers/:id/status', requireEmployee, toggleCustomerStatus);
router.post('/packages', requireEmployee, createPackage);
router.put('/packages/:id', requireEmployee, updatePackage);
router.patch('/packages/:id/status', requireEmployee, togglePackageStatus);
router.delete('/packages/:id', requireEmployee, deletePackage);

// Notifications endpoints (shared)
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadNotificationsCount);
router.post('/notifications/mark-read', markNotificationsAsRead);

module.exports = router;
