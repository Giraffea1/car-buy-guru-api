import { Router } from 'express';
import { searchCars, getCarInfo, getMarketData } from '../controllers/cars';
import { optionalAuth } from '../middleware/auth';

const router = Router();

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

export default router;
