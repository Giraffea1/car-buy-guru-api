import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { IAuthRequest, ILoginRequest, IRegisterRequest, ApiResponse } from '../types';
import User from '../models/User';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const { firstName, lastName, email, password }: IRegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
          res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    } as ApiResponse);
      return;
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const { email, password }: ILoginRequest = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as ApiResponse);
      return;
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    
    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fieldsToUpdate: Partial<{ 
      firstName: string; 
      lastName: string; 
      email: string; 
      zipcode: string; 
      avatar: string; 
      password: string;
      preferences: any 
    }> = {};
    
    // Only update provided fields
    if (req.body.firstName) fieldsToUpdate.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) fieldsToUpdate.lastName = req.body.lastName;
    if (req.body.email) fieldsToUpdate.email = req.body.email;
    if (req.body.zipcode !== undefined) fieldsToUpdate.zipcode = req.body.zipcode;
    if (req.body.avatar) fieldsToUpdate.avatar = req.body.avatar;
    if (req.body.preferences) fieldsToUpdate.preferences = req.body.preferences;

    // Handle password update separately if provided
    if (req.body.currentPassword && req.body.newPassword) {
      const userWithPassword = await User.findById(req.user?.userId).select('+password');
      if (!userWithPassword) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      // Verify current password
      const isValidPassword = await userWithPassword.matchPassword(req.body.currentPassword);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        } as ApiResponse);
        return;
      }

      // Add new password to update fields
      fieldsToUpdate.password = req.body.newPassword;
    }

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  logout,
  getMe,
  updateProfile
};