import { Router } from 'express';
import {
  createEvaluation,
  getEvaluations,
  getEvaluation,
  updateEvaluation,
  deleteEvaluation,
  analyzeMarket,
  updateInspection,
  generateRecommendations
} from '../controllers/evaluations';
import { protect, optionalAuth } from '../middleware/auth';
import { validateEvaluation } from '../validators/evaluation';

const router = Router();

// @route   POST /api/evaluations
// @desc    Create new car evaluation
// @access  Public (supports guest users)
router.post('/', optionalAuth, validateEvaluation, createEvaluation);

// @route   GET /api/evaluations
// @desc    Get user's evaluations
// @access  Private/Guest
router.get('/', optionalAuth, getEvaluations);

// @route   GET /api/evaluations/:id
// @desc    Get single evaluation
// @access  Private/Guest
router.get('/:id', optionalAuth, getEvaluation);

// @route   PUT /api/evaluations/:id
// @desc    Update evaluation
// @access  Private/Guest
router.put('/:id', optionalAuth, updateEvaluation);

// @route   DELETE /api/evaluations/:id
// @desc    Delete evaluation
// @access  Private/Guest
router.delete('/:id', optionalAuth, deleteEvaluation);

// @route   POST /api/evaluations/:id/analyze
// @desc    Run market analysis
// @access  Private/Guest
router.post('/:id/analyze', optionalAuth, analyzeMarket);

// @route   PUT /api/evaluations/:id/inspection
// @desc    Update inspection results
// @access  Private/Guest
router.put('/:id/inspection', optionalAuth, updateInspection);

// @route   POST /api/evaluations/:id/recommendations
// @desc    Generate final recommendations
// @access  Private/Guest
router.post('/:id/recommendations', optionalAuth, generateRecommendations);

export default router;
