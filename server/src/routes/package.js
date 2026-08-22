const express = require('express');
const { listPackages } = require('../controllers/packageController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce auth & admin context for package operations
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', listPackages);

module.exports = router;
