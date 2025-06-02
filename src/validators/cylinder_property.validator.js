const { body } = require('express-validator');

const createCylinderPropertyValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('size_cubic_meter').optional({ checkFalsy: true }).isDecimal().withMessage('Size must be a decimal').toFloat(),
  body('material').optional().trim().isLength({ max: 50 }),
  body('max_age_years').optional().isInt({ min: 0 }).withMessage('Max age must be a non-negative integer').toInt(),
  body('default_buy_price').optional({ checkFalsy: true }).isDecimal().withMessage('Buy price must be a decimal').toFloat(),
  body('default_rent_price_per_day').optional({ checkFalsy: true }).isDecimal().withMessage('Rent price must be a decimal').toFloat(),
  body('notes').optional().trim(),
];

const updateCylinderPropertyValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('size_cubic_meter').optional({ checkFalsy: true }).isDecimal().withMessage('Size must be a decimal').toFloat(),
  body('material').optional().trim().isLength({ max: 50 }),
  body('max_age_years').optional().isInt({ min: 0 }).withMessage('Max age must be a non-negative integer').toInt(),
  body('default_buy_price').optional({ checkFalsy: true }).isDecimal().withMessage('Buy price must be a decimal').toFloat(),
  body('default_rent_price_per_day').optional({ checkFalsy: true }).isDecimal().withMessage('Rent price must be a decimal').toFloat(),
  body('notes').optional().trim(),
];

module.exports = {
  createCylinderPropertyValidation,
  updateCylinderPropertyValidation,
};
