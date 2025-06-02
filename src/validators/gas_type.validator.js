const { body } = require('express-validator');

const createGasTypeValidation = [
  body('name').trim().notEmpty().withMessage('Gas type name is required').isLength({ min: 2, max: 100 }).withMessage('Gas type name must be between 2 and 100 characters'),
  body('description').trim().optional().isString(),
];

const updateGasTypeValidation = [
  body('name').trim().optional().notEmpty().withMessage('Gas type name cannot be empty').isLength({ min: 2, max: 100 }).withMessage('Gas type name must be between 2 and 100 characters'),
  body('description').trim().optional().isString(),
];

module.exports = {
  createGasTypeValidation,
  updateGasTypeValidation,
};
