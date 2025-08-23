import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { randomBytes } from 'crypto';
import CarEvaluation from '../models/CarEvaluation';
import { IAuthRequest, ApiResponse, IRepairCost, IInspectionResult } from '../types';

// Helper function to generate session ID for guests
const generateSessionId = (): string => {
  return randomBytes(16).toString('hex');
};

// Helper function to get session ID from request
const getSessionId = (req: IAuthRequest): string => {
  if (req.user) {
    return req.user.userId;
  }
  return (req.headers['x-session-id'] as string) || generateSessionId();
};

// @desc    Create new car evaluation
// @route   POST /api/evaluations
// @access  Public
export const createEvaluation = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { year, make, model, mileage, price, vin, description } = req.body;
    const sessionId = getSessionId(req);

    const evaluationData = {
      userId: req.user ? req.user.userId : undefined,
      carDetails: {
        year,
        make,
        model,
        mileage,
        price,
        vin: vin?.toUpperCase(),
        description
      },
      photos: [],
      carfax: {
        requested: false,
        purchased: false,
        wantCarfax: false,
        price: 0,
        vin: vin?.toUpperCase() || ''
      },
      inspection: {
        general: { completed: false, issues: [] },
        mechanical: { completed: false, results: [] },
        paperwork: { completed: false, liens: [] }
      },
      status: 'draft' as const,
      progress: 20 // Basic details filled
    };

    const evaluation = await CarEvaluation.create(evaluationData);

    res.status(201).json({
      success: true,
      message: 'Car evaluation created successfully',
      data: evaluation.getSummary()
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's evaluations
// @route   GET /api/evaluations
// @access  Private/Guest
export const getEvaluations = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: any = {};
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
      if (!query.sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID required for guest access'
        } as ApiResponse);
        return;
      }
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const evaluations = await CarEvaluation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CarEvaluation.countDocuments(query);
    const summaries = evaluations.map(evaluation => evaluation.getSummary());

    res.json({
      success: true,
      message: 'Evaluations retrieved successfully',
      data: summaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Get single evaluation
// @route   GET /api/evaluations/:id
// @access  Private/Guest
export const getEvaluation = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    const evaluation = await CarEvaluation.findOne(query);

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Evaluation retrieved successfully',
      data: evaluation
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private/Guest
export const updateEvaluation = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updates._id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const evaluation = await CarEvaluation.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    // Recalculate progress
    evaluation.calculateProgress();
    await evaluation.save();

    res.json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private/Guest
export const deleteEvaluation = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    const evaluation = await CarEvaluation.findOneAndDelete(query);

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Evaluation deleted successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Run market analysis for evaluation
// @route   POST /api/evaluations/:id/analyze
// @access  Private/Guest
export const analyzeMarket = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    const evaluation = await CarEvaluation.findOne(query);

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    // Mock market analysis
    const { year, make, model, mileage, price } = evaluation.carDetails;
    
    // Calculate estimated value based on mock logic
    const baseValue = Math.floor(Math.random() * 20000) + 15000;
    const mileageAdjustment = Math.max(0, (150000 - mileage) / 15000) * 1000;
    const ageAdjustment = Math.max(0, (2024 - year)) * -800;
    
    const estimatedValue = Math.round(baseValue + mileageAdjustment + ageAdjustment);
    const priceVsMarket = ((price - estimatedValue) / estimatedValue) * 100;
    
    // Calculate deal score (0-100)
    let dealScore = 50;
    if (priceVsMarket < -20) dealScore = 90;
    else if (priceVsMarket < -10) dealScore = 75;
    else if (priceVsMarket < 0) dealScore = 65;
    else if (priceVsMarket < 10) dealScore = 45;
    else if (priceVsMarket < 20) dealScore = 30;
    else dealScore = 15;

    const marketAnalysis = {
      estimatedValue,
      priceVsMarket: Math.round(priceVsMarket),
      dealScore,
      comparable: [
        {
          source: 'Cars.com',
          price: estimatedValue + Math.floor((Math.random() - 0.5) * 4000),
          mileage: mileage + Math.floor((Math.random() - 0.5) * 20000),
          location: 'Local Area'
        },
        {
          source: 'AutoTrader',
          price: estimatedValue + Math.floor((Math.random() - 0.5) * 3000),
          mileage: mileage + Math.floor((Math.random() - 0.5) * 15000),
          location: 'Regional'
        },
        {
          source: 'CarGurus',
          price: estimatedValue + Math.floor((Math.random() - 0.5) * 3500),
          mileage: mileage + Math.floor((Math.random() - 0.5) * 18000),
          location: 'National'
        }
      ]
    };

    // Update evaluation
    evaluation.marketAnalysis = marketAnalysis;
    evaluation.status = 'analyzing';
    evaluation.calculateProgress();
    await evaluation.save();

    res.json({
      success: true,
      message: 'Market analysis completed',
      data: {
        evaluation: evaluation.getSummary(),
        marketAnalysis
      }
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Update inspection results
// @route   PUT /api/evaluations/:id/inspection
// @access  Private/Guest
export const updateInspection = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { inspectionType, results } = req.body;
    
    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    const evaluation = await CarEvaluation.findOne(query);

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    // Update inspection results
    if (inspectionType === 'general') {
      evaluation.inspection.general = {
        ...evaluation.inspection.general,
        ...results,
        completed: true
      };
    } else if (inspectionType === 'mechanical') {
      evaluation.inspection.mechanical = {
        ...evaluation.inspection.mechanical,
        ...results,
        completed: true
      };
    } else if (inspectionType === 'paperwork') {
      evaluation.inspection.paperwork = {
        ...evaluation.inspection.paperwork,
        ...results,
        completed: true
      };
    }

    evaluation.status = 'in_progress';
    evaluation.calculateProgress();
    await evaluation.save();

    res.json({
      success: true,
      message: 'Inspection results updated',
      data: evaluation
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Generate final recommendations
// @route   POST /api/evaluations/:id/recommendations
// @access  Private/Guest
export const generateRecommendations = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query: any = { _id: id };
    
    if (req.user) {
      query.userId = req.user.userId;
    } else {
      query.sessionId = req.headers['x-session-id'];
    }

    const evaluation = await CarEvaluation.findOne(query);

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      } as ApiResponse);
      return;
    }

    // Calculate repair costs based on inspection results
    const repairCosts: IRepairCost[] = [];
    
    if (evaluation.inspection.mechanical.completed) {
      evaluation.inspection.mechanical.results.forEach((result: IInspectionResult) => {
        if (result.status === 'fail') {
          repairCosts.push({
            issue: result.item,
            estimatedCost: Math.floor(Math.random() * 2000) + 200,
            priority: Math.random() > 0.6 ? 'high' : 'medium'
          });
        }
      });
    }

    const totalRepairCosts = repairCosts.reduce((total, cost) => total + cost.estimatedCost, 0);
    const estimatedValue = evaluation.marketAnalysis?.estimatedValue || evaluation.carDetails.price;
    
    const recommendations = {
      suggestedOffer: Math.round(estimatedValue - totalRepairCosts - (estimatedValue * 0.1)),
      maxOffer: Math.round(estimatedValue - totalRepairCosts),
      walkAwayPrice: Math.round(estimatedValue + (estimatedValue * 0.05)),
      repairCosts,
      negotiationPoints: [
        'Point out any mechanical issues discovered',
        'Reference market pricing data',
        'Highlight repair costs needed',
        'Be prepared to walk away if price is too high',
        'Consider the total cost of ownership'
      ]
    };

    // Update evaluation
    evaluation.recommendations = recommendations;
    evaluation.status = 'completed';
    evaluation.calculateProgress();
    await evaluation.save();

    res.json({
      success: true,
      message: 'Recommendations generated',
      data: {
        evaluation: evaluation.getSummary(),
        recommendations
      }
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};