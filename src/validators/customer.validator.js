const { body, param } = require('express-validator');
const { User } = require('../models');

const commonCustomerValidation = [
  body('customer_name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 150 }),
  body('company_name').optional().trim().isLength({ max: 150 }),
  body('phone_number').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 7, max: 20 }).withMessage('Phone number is invalid'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Must be a valid email address').isLength({ max: 100 }),
  body('shipping_address_default').trim().notEmpty().withMessage('Default shipping address is required'),
  body('billing_address_default').optional({ checkFalsy: true }).trim(),
  body('contact_person').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('customer_type').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
];

const createCustomerValidation = [...commonCustomerValidation];

const updateCustomerValidation = [
  param('id').isInt({ gt: 0 }).withMessage('Customer ID must be a positive integer.'),
  ...commonCustomerValidation.map((validation) => validation.optional()),
  body('customer_name').optional().trim().notEmpty().withMessage('Customer name cannot be empty if provided').isLength({ max: 150 }),
  body('phone_number').optional().trim().notEmpty().withMessage('Phone number cannot be empty if provided').isLength({ min: 7, max: 20 }),
  body('shipping_address_default').optional().trim().notEmpty().withMessage('Default shipping address cannot be empty if provided'),
];

module.exports = {
  createCustomerValidation,
  updateCustomerValidation,
};
