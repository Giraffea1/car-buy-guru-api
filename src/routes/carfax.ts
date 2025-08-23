import { Router } from 'express';
import { getCarfaxPrice, requestCarfaxReport } from '../controllers/carfax';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// @route   GET /api/carfax/price
// @desc    Get Carfax report pricing
// @access  Public
router.get('/price', optionalAuth, getCarfaxPrice);

// @route   POST /api/carfax/request
// @desc    Request Carfax report for VIN
// @access  Public
router.post('/request', optionalAuth, requestCarfaxReport);

export default router;
