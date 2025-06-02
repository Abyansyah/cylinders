const { body } = require('express-validator');

const createWarehouseValidation = [
  body('name').trim().notEmpty().withMessage('Warehouse name is required').isLength({ max: 100 }),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone_number').optional({ checkFalsy: true }).trim().isMobilePhone('any').withMessage('Invalid phone number format'), // 'any' untuk format umum
];

const updateWarehouseValidation = [
  body('name').optional().trim().notEmpty().withMessage('Warehouse name cannot be empty').isLength({ max: 100 }),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('phone_number').optional({ checkFalsy: true }).trim().isMobilePhone('any').withMessage('Invalid phone number format'),
];

module.exports = {
  createWarehouseValidation,
  updateWarehouseValidation,
};
