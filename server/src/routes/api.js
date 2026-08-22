const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');

const router = express.Router();

// Mount endpoints under the API namespace
router.use('/', healthRouter);
router.use('/auth', authRouter);

// Placeholders for future routes
// router.use('/auth', authRouter);
// router.use('/customers', customersRouter);
// router.use('/packages', packagesRouter);

module.exports = router;
