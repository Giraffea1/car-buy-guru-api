const express = require('express');
const { processPayment, getPaymentMethods } = require('../controllers/payments');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', optionalAuth, getPaymentMethods);

// @route   POST /api/payments/process
// @desc    Process payment for Carfax or other services
// @access  Public
router.post('/process', optionalAuth, processPayment);

module.exports = router;
