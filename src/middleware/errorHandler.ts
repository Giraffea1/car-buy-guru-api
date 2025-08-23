import { Request, Response, NextFunction } from 'express';
import { IErrorResponse } from '../types';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  errors?: { [key: string]: { message: string } };
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: { message: string; statusCode: number } = {
    message: err.message || 'Server Error',
    statusCode: err.statusCode || 500
  };

  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = {
      message: 'Resource not found',
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = {
      message: 'Duplicate field value entered',
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401
    };
  }

  const errorResponse: IErrorResponse = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(error.statusCode).json(errorResponse);
};

export default errorHandler;
