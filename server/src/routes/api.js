const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');

const router = express.Router();

// Mount endpoints under the API namespace
router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);

module.exports = router;
