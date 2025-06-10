'use strict';
const { body, param } = require('express-validator');

const createDeliveryValidation = [
  body('order_id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'),
  body('driver_user_id').isInt({ gt: 0 }).withMessage('Driver user ID must be a positive integer.'),
  body('vehicle_number').optional().isString().isLength({ max: 20 }).withMessage('Vehicle number must be a string with a max length of 20.'),
];

const completeDeliveryValidation = [param('id').isInt({ gt: 0 }).withMessage('Delivery ID must be a positive integer.'), body('notes_driver').optional().isString().withMessage('Driver notes must be a string.')];

module.exports = {
  createDeliveryValidation,
  completeDeliveryValidation,
};
