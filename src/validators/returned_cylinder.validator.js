'use strict';
const { body } = require('express-validator');

const pickupEmptyCylinderValidation = [
  body('customer_id').isInt({ gt: 0 }).withMessage('Customer ID must be a positive integer.'),
  body('barcodes').isArray({ min: 1 }).withMessage('Barcodes must be an array with at least one item.'),
  body('barcodes.*').isString().notEmpty().withMessage('Each barcode must be a non-empty string.'),
];

const receiveReturnedCylindersValidation = [
  body('barcodes').isArray({ min: 1 }).withMessage('Barcodes must be an array with at least one item.'),
  body('barcodes.*').isString().notEmpty().withMessage('Each barcode must be a non-empty string.'),
];

module.exports = {
  pickupEmptyCylinderValidation,
  receiveReturnedCylindersValidation,
};
