import { Request, Response } from 'express';
import { Document, Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

// Base Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName?: string;
  email: string;
  zipcode?: string;
  avatar?: string;
  password: string;
  role: 'user' | 'admin';
  subscription: 'free' | 'premium';
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
    };
    darkMode: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  getSignedJwtToken(): string;
  matchPassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): any;
}

export interface ICarDetails {
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number;
  vin?: string;
  description?: string;
}

export interface ICarfaxData {
  requested: boolean;
  purchased: boolean;
  wantCarfax: boolean;
  price: number;
  vin: string;
  reportId?: string;
  data?: {
    accidents: number;
    owners: number;
    serviceRecords: number;
    titleIssues: string[];
    recalls: number;
  };
}

export interface IMarketAnalysis {
  estimatedValue: number;
  priceVsMarket: number;
  dealScore: number;
  comparable: Array<{
    source: string;
    price: number;
    mileage: number;
    location: string;
  }>;
}

export interface IInspectionResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  notes?: string;
}

export interface IInspection {
  general: {
    completed: boolean;
    notes?: string;
    issues: string[];
  };
  mechanical: {
    completed: boolean;
    results: IInspectionResult[];
  };
  paperwork: {
    completed: boolean;
    vinMatch?: 'pass' | 'fail';
    titleStatus?: string;
    ownershipVerified?: 'pass' | 'fail';
    liens: string[];
  };
}

export interface IRepairCost {
  issue: string;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high';
}

export interface IRecommendations {
  suggestedOffer: number;
  maxOffer: number;
  walkAwayPrice: number;
  repairCosts: IRepairCost[];
  negotiationPoints: string[];
}

export interface ICarEvaluation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  carDetails: ICarDetails;
  photos: Array<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: Date;
  }>;
  carfax: ICarfaxData;
  marketAnalysis?: IMarketAnalysis;
  inspection: IInspection;
  recommendations?: IRecommendations;
  status: 'draft' | 'analyzing' | 'in_progress' | 'awaiting_carfax' | 'completed' | 'archived';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  carDisplayName: string;
  getSummary(): any;
  calculateProgress(): number;
}

// Authentication Types
export interface IAuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IAuthRequest extends Request {
  user?: IAuthPayload;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    subscription: string;
  };
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Payment Types
export interface IPaymentData {
  method: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface IPaymentResult {
  transactionId: string;
  status: 'completed' | 'failed' | 'pending';
  amount: number;
  currency: string;
  paymentMethod: string;
  processedAt: Date;
}

// Validation Types
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface IValidationResult {
  isValid: boolean;
  errors: IValidationError[];
}

// Car Data Types
export interface ICarInfo {
  year: number;
  make: string;
  model: string;
  bodyStyle: string;
  engine: string;
  transmission: string;
  fuelEconomy: {
    city: number;
    highway: number;
  };
  commonIssues: string[];
  recalls: number;
  reliability: string;
  depreciation: number;
}

export interface IMarketData {
  estimatedValue: number;
  priceRange: {
    low: number;
    high: number;
  };
  dealerAverage: number;
  privateSellerAverage: number;
  tradeInValue: number;
  dataSource: string;
  lastUpdated: Date;
  comparable: Array<{
    source: string;
    count: number;
    avgPrice: number;
    avgMileage: number;
  }>;
}

// Express Types
export interface IAuthenticatedRequest extends Request {
  user: IAuthPayload;
}

export interface IControllerResponse extends Response {
  status(code: number): this;
  json(obj: any): this;
}

// Middleware Types
export interface IMiddlewareOptions {
  message?: string;
  statusCode?: number;
}

export interface IRateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
}

// Database Types
export interface IDatabaseConfig {
  uri: string;
  options?: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
  };
}

// Error Types
export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface IErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
}

// External API Types
export interface ICarfaxApiResponse {
  reportId: string;
  vin: string;
  data: {
    accidents: number;
    owners: number;
    serviceRecords: number;
    titleIssues: string[];
    recalls: number;
    report: {
      url: string;
      downloadUrl: string;
    };
  };
}

export interface IMarketApiResponse {
  success: boolean;
  data: {
    estimatedValue: number;
    marketPrice: number;
    priceRange: {
      low: number;
      high: number;
    };
    comparable: Array<{
      source: string;
      price: number;
      mileage: number;
      location: string;
    }>;
  };
}

// Configuration Types
export interface IAppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  mongoUri: string;
  jwtSecret: string;
  jwtExpiry: string;
  corsOrigin: string[];
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// Service Types
export interface IEmailService {
  sendWelcomeEmail(to: string, name: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendEvaluationCompleteEmail(to: string, evaluationId: string): Promise<void>;
}

export interface IUploadService {
  uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

export interface ICarfaxService {
  requestReport(vin: string): Promise<ICarfaxApiResponse>;
  getReportData(reportId: string): Promise<any>;
}

export interface IMarketService {
  getMarketData(car: ICarDetails): Promise<IMarketApiResponse>;
  calculateDealScore(car: ICarDetails, marketData: IMarketData): Promise<number>;
}

// Export commonly used types
export type AuthRequest = IAuthenticatedRequest;
export type ApiResponse<T = any> = IApiResponse<T>;
export type PaginatedResponse<T> = IPaginatedResponse<T>;
export type ValidationResult = IValidationResult;
export type AppError = IAppError;
export type DatabaseConfig = IDatabaseConfig;
