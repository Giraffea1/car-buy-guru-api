const CarEvaluation = require('../models/CarEvaluation');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Helper function to generate session ID for guests
const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Helper function to get session ID from request
const getSessionId = (req) => {
  if (req.user) {
    return req.user.id;
  }
  return req.headers['x-session-id'] || generateSessionId();
};

// @desc    Create new car evaluation
// @route   POST /api/evaluations
// @access  Public
const createEvaluation = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const sessionId = getSessionId(req);
    
    const evaluationData = {
      user: req.user ? req.user.id : null,
      sessionId,
      carDetails: req.body,
      status: 'draft'
    };

    const evaluation = await CarEvaluation.create(evaluationData);
    
    // Calculate initial progress
    evaluation.calculateProgress();
    await evaluation.save();

    res.status(201).json({
      success: true,
      data: evaluation,
      sessionId // Return session ID for guest users
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's evaluations
// @route   GET /api/evaluations
// @access  Private/Guest
const getEvaluations = async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);
    
    let query = {};
    if (req.user) {
      query.user = req.user.id;
    } else {
      query.sessionId = req.headers['x-session-id'];
      if (!query.sessionId) {
        return res.json({
          success: true,
          data: []
        });
      }
    }

    const evaluations = await CarEvaluation.find(query)
      .sort({ updatedAt: -1 })
      .limit(50);

    // Return summaries only
    const summaries = evaluations.map(eval => eval.getSummary());

    res.json({
      success: true,
      count: evaluations.length,
      data: summaries
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single evaluation
// @route   GET /api/evaluations/:id
// @access  Private/Guest
const getEvaluation = async (req, res, next) => {
  try {
    const evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    const sessionId = getSessionId(req);
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this evaluation'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this evaluation'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private/Guest
const updateEvaluation = async (req, res, next) => {
  try {
    let evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this evaluation'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this evaluation'
      });
    }

    evaluation = await CarEvaluation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Recalculate progress
    evaluation.calculateProgress();
    await evaluation.save();

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private/Guest
const deleteEvaluation = async (req, res, next) => {
  try {
    const evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this evaluation'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this evaluation'
      });
    }

    await evaluation.deleteOne();

    res.json({
      success: true,
      message: 'Evaluation deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Run market analysis
// @route   POST /api/evaluations/:id/analyze
// @access  Private/Guest
const analyzeMarket = async (req, res, next) => {
  try {
    const evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Mock market analysis (in real app, integrate with KBB, Edmunds, etc.)
    const { year, make, model, mileage, price } = evaluation.carDetails;
    
    // Simulate market analysis
    const baseValue = price * (0.85 + Math.random() * 0.3); // Random market value
    const priceVsMarket = ((price - baseValue) / baseValue) * 100;
    
    let dealScore = 75; // Base score
    if (priceVsMarket < -10) dealScore += 15;
    else if (priceVsMarket > 10) dealScore -= 20;
    
    // Adjust for mileage (rough calculation)
    const expectedMileage = (new Date().getFullYear() - year) * 12000;
    if (mileage < expectedMileage * 0.8) dealScore += 10;
    else if (mileage > expectedMileage * 1.2) dealScore -= 15;

    dealScore = Math.max(0, Math.min(100, dealScore));

    const marketAnalysis = {
      estimatedValue: Math.round(baseValue),
      priceVsMarket: Math.round(priceVsMarket * 100) / 100,
      dealScore: Math.round(dealScore),
      comparable: [
        {
          source: 'AutoTrader',
          price: Math.round(baseValue * 1.05),
          mileage: mileage + 5000,
          location: 'Nearby City'
        },
        {
          source: 'Cars.com',
          price: Math.round(baseValue * 0.95),
          mileage: mileage - 3000,
          location: 'Local Area'
        }
      ]
    };

    evaluation.marketAnalysis = marketAnalysis;
    evaluation.status = 'analyzing';
    evaluation.calculateProgress();
    
    await evaluation.save();

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update inspection results
// @route   PUT /api/evaluations/:id/inspection
// @access  Private/Guest
const updateInspection = async (req, res, next) => {
  try {
    const evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update inspection data
    const { inspectionType, data } = req.body;
    
    if (inspectionType === 'general') {
      evaluation.inspection.general = { ...evaluation.inspection.general, ...data };
    } else if (inspectionType === 'mechanical') {
      evaluation.inspection.mechanical = { ...evaluation.inspection.mechanical, ...data };
    } else if (inspectionType === 'paperwork') {
      evaluation.inspection.paperwork = { ...evaluation.inspection.paperwork, ...data };
    }

    evaluation.status = 'in_progress';
    evaluation.calculateProgress();
    
    await evaluation.save();

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Generate final recommendations
// @route   POST /api/evaluations/:id/recommendations
// @access  Private/Guest
const generateRecommendations = async (req, res, next) => {
  try {
    const evaluation = await CarEvaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    // Check ownership
    if (req.user && evaluation.user && evaluation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (!req.user && evaluation.sessionId !== req.headers['x-session-id']) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Generate recommendations based on analysis and inspection
    const { price } = evaluation.carDetails;
    const { estimatedValue, priceVsMarket } = evaluation.marketAnalysis || {};
    
    // Calculate repair costs from inspection
    let totalRepairCosts = 0;
    const repairCosts = [];
    
    // Add mock repair costs based on inspection failures
    if (evaluation.inspection.mechanical?.results) {
      evaluation.inspection.mechanical.results.forEach(result => {
        if (result.status === 'fail') {
          const cost = Math.floor(Math.random() * 500) + 100; // $100-600
          totalRepairCosts += cost;
          repairCosts.push({
            issue: result.item,
            estimatedCost: cost,
            priority: 'medium'
          });
        }
      });
    }

    const marketAdjustment = estimatedValue ? (price - estimatedValue) : (price * 0.05);
    const suggestedOffer = price - totalRepairCosts - Math.max(0, marketAdjustment);
    
    const recommendations = {
      suggestedOffer: Math.round(Math.max(suggestedOffer, price * 0.7)), // Don't go below 70% of asking
      maxOffer: Math.round(Math.max(suggestedOffer + 500, price * 0.8)),
      walkAwayPrice: price,
      repairCosts,
      negotiationPoints: [
        'Point out documented repair needs',
        'Reference market analysis showing overpricing',
        'Mention inspection findings professionally',
        'Be prepared to walk away if price doesn\'t come down'
      ]
    };

    evaluation.recommendations = recommendations;
    evaluation.status = 'completed';
    evaluation.analytics.completedAt = new Date();
    evaluation.calculateProgress();
    
    await evaluation.save();

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvaluation,
  getEvaluations,
  getEvaluation,
  updateEvaluation,
  deleteEvaluation,
  analyzeMarket,
  updateInspection,
  generateRecommendations
};
