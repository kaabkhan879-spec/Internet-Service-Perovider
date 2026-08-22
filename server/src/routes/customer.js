const express = require('express');
const {
  listCustomers,
  getCustomerDetails,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  assignPackage
} = require('../controllers/customerController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce auth & admin context for customer operations
router.use(requireAuth);
router.use(requireAdmin);

// Customer endpoints
router.get('/', listCustomers);
router.get('/:id', getCustomerDetails);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/status', toggleCustomerStatus);
router.post('/:id/assign-package', assignPackage);

module.exports = router;
