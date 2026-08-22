const express = require('express');
const { employeeLogin, employeeProfile } = require('../controllers/employeeAuthController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication endpoint
router.post('/login', employeeLogin);

// Profile endpoint (Requires standard session verification context)
router.get('/profile', requireAuth, employeeProfile);

module.exports = router;
