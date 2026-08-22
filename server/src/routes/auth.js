const express = require('express');
const { login, me, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, me);

module.exports = router;
