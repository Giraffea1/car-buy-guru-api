import { Router } from 'express';
import { register, login, logout, getMe, updateProfile } from '../controllers/auth';
import { protect } from '../middleware/auth';
import { validateRegister, validateLogin } from '../validators/auth';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

export default router;
