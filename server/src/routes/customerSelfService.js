const express = require('express');
const {
  customerLogin,
  getCustomerDashboard,
  getCustomerProfile,
  updateCustomerProfile,
  changePassword,
  getInternetService,
  getBillingHistory,
  getComplaints,
  submitComplaint,
  getComplaintDetails,
  getServiceRequests,
  submitServiceRequest
} = require('../controllers/customerSelfServiceController');
const { requireAuth, requireCustomer } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', customerLogin);

// Protected routes (require valid session and customer role)
router.use(requireAuth);
router.use(requireCustomer);

router.get('/dashboard', getCustomerDashboard);
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.put('/change-password', changePassword);
router.get('/service', getInternetService);
router.get('/billing', getBillingHistory);
router.get('/complaints', getComplaints);
router.post('/complaints', submitComplaint);
router.get('/complaints/:id', getComplaintDetails);
router.get('/service-requests', getServiceRequests);
router.post('/service-requests', submitServiceRequest);

module.exports = router;
