'use strict';
const { body } = require('express-validator');

const productValidation = [
  body('sku').optional().isLength({ max: 100 }),
  body('name').notEmpty().withMessage('Product name is required.').isLength({ max: 255 }),
  body('is_active').optional().isBoolean(),
  body('description').optional().isString(),
  body('unit').optional().isString().isLength({ max: 20 }),
  body('rent_price').optional({ checkFalsy: true }).isDecimal(),
  body('buy_price').optional({ checkFalsy: true }).isDecimal(),
  body('cylinder_properties_id').optional({ checkFalsy: true }).isInt(),
  body('gas_type_id').optional({ checkFalsy: true }).isInt(),
];

module.exports = {
  productValidation,
};
