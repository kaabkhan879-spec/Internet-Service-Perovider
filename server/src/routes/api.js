const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const customerRouter = require('./customer');
const packageRouter = require('./package');
const adminRouter = require('./admin');
const employeeRouter = require('./employee');

const router = express.Router();

// Mount endpoints under the API namespace
router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/customers', customerRouter);
router.use('/packages', packageRouter);
router.use('/admin', adminRouter);
router.use('/employee', employeeRouter);

module.exports = router;
