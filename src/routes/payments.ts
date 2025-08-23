import { Router } from 'express';
import { processPayment, getPaymentMethods } from '../controllers/payments';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', optionalAuth, getPaymentMethods);

// @route   POST /api/payments/process
// @desc    Process payment for Carfax or other services
// @access  Public
router.post('/process', optionalAuth, processPayment);

export default router;
