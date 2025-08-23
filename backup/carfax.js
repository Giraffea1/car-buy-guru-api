const express = require('express');
const { getCarfaxPrice, requestCarfaxReport } = require('../controllers/carfax');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/carfax/price
// @desc    Get Carfax report pricing
// @access  Public
router.get('/price', optionalAuth, getCarfaxPrice);

// @route   POST /api/carfax/request
// @desc    Request Carfax report for VIN
// @access  Public
router.post('/request', optionalAuth, requestCarfaxReport);

module.exports = router;
