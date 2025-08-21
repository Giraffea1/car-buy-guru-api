const { body } = require('express-validator');

const validateEvaluation = [
  body('year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage(`Year must be between 1990 and ${new Date().getFullYear() + 1}`),
  
  body('make')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Make is required and must be less than 50 characters'),
  
  body('model')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model is required and must be less than 50 characters'),
  
  body('mileage')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Mileage must be a positive number less than 1,000,000'),
  
  body('price')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Price must be a positive number less than $1,000,000'),
  
  body('vin')
    .optional()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters')
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/)
    .withMessage('VIN contains invalid characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

module.exports = {
  validateEvaluation
};
