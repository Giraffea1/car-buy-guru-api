const express = require('express');
const { searchCars, getCarInfo, getMarketData } = require('../controllers/cars');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cars/search
// @desc    Search for cars by make/model/year
// @access  Public
router.get('/search', optionalAuth, searchCars);

// @route   GET /api/cars/info/:year/:make/:model
// @desc    Get detailed car information
// @access  Public
router.get('/info/:year/:make/:model', optionalAuth, getCarInfo);

// @route   GET /api/cars/market-data
// @desc    Get market pricing data
// @access  Public
router.get('/market-data', optionalAuth, getMarketData);

module.exports = router;
