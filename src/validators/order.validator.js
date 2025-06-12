const { body, param, query } = require('express-validator');
const { Customer, User, CylinderProperty, GasType } = require('../models');

const orderTypes = ['Sewa', 'Beli'];
const orderStatuses = ['Baru', 'Dikonfirmasi Sales', 'Dibatalkan Sales', 'Disiapkan Gudang', 'Siap Kirim', 'Dikirim', 'Selesai', 'Dibatalkan Sistem'];
const assignmentStatuses = ['Dialokasikan', 'Dikirim', 'Diterima Pelanggan', 'Dikembalikan Gudang', 'Selesai Rental'];

const createOrderValidation = [
  body('customer_id').notEmpty().isInt({ gt: 0 }),
  body('assigned_warehouse_id').notEmpty().isInt({ gt: 0 }),
  body('order_type').notEmpty().isIn(orderTypes),
  body('shipping_address').optional(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').notEmpty().isInt({ gt: 0 }),
  body('items.*.quantity').notEmpty().isInt({ gt: 1 }),
  body('items.*.unit').optional().isString(),
  body('items.*.is_rental').isBoolean(),
];

const updateOrderStatusValidation = [
  param('id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(orderStatuses)
    .withMessage(`Status must be one of: ${orderStatuses.join(', ')}`),
];

const getOrdersQueryValidation = [
  query('status').optional().isIn(orderStatuses).withMessage('Invalid status filter.'),
  query('customer_id').optional().isInt({ gt: 0 }).withMessage('Customer ID filter must be a positive integer.'),
  query('date_start').optional().isISO8601().toDate().withMessage('Invalid start date filter.'),
  query('date_end').optional().isISO8601().toDate().withMessage('Invalid end date filter.'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
];

const recommendCylindersValidation = [param('order_id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'), param('item_id').isInt({ gt: 0 }).withMessage('Order Item ID must be a positive integer.')];

const assignCylinderValidation = [
  param('item_id').isInt({ gt: 0 }).withMessage('Order Item ID must be a positive integer.'),
  body('barcode_ids').isArray({ min: 1 }).withMessage('barcode_ids must be an array of one or more barcodes.'),
  body('barcode_ids.*').isString().notEmpty().withMessage('Each item in barcode_ids must be a non-empty string.'),
  body('notes_petugas_gudang').optional({ checkFalsy: true }).trim().isString(),
];

const assignAllCylindersToOrderValidation = [
  param('order_id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'),
  body('assignments').isArray({ min: 1 }).withMessage('The "assignments" field must be an array.'),
  body('assignments.*.order_item_id').notEmpty().isInt({ gt: 0 }).withMessage('Each assignment must have a valid order_item_id.'),
  body('assignments.*.barcode_ids').isArray({ min: 1 }).withMessage('Each assignment must have a barcode_ids array.'),
  body('assignments.*.barcode_ids.*').isString().notEmpty().withMessage('Barcodes must be non-empty strings.'),
  body('notes_petugas_gudang').optional({ checkFalsy: true }).trim().isString(),
];

const reassignWarehouseValidation = [
  param('id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'),
  body('new_warehouse_id').notEmpty().withMessage('New warehouse ID is required.').isInt({ gt: 0 }).withMessage('New warehouse ID must be a positive integer.'),
];

const markOrderPreparedValidation = [param('order_id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.')];

const validateCylindersForOrderItemValidation = [
  param('item_id').isInt({ gt: 0 }).withMessage('Order Item ID must be a positive integer.'),
  body('barcode_ids').isArray({ min: 1 }).withMessage('barcode_ids must be an array of barcodes.'),
  body('barcode_ids.*').isString().notEmpty().withMessage('Each item in barcode_ids must be a non-empty string.'),
];

const cancelOrderValidation = [param('id').isInt({ gt: 0 }).withMessage('Order ID must be a positive integer.'), body('notes').optional().isString().withMessage('Cancellation notes must be a string.')];

module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
  getOrdersQueryValidation,
  recommendCylindersValidation,
  assignCylinderValidation,
  markOrderPreparedValidation,
  orderStatuses,
  orderTypes,
  assignmentStatuses,
  reassignWarehouseValidation,
  validateCylindersForOrderItemValidation,
  assignAllCylindersToOrderValidation,
  cancelOrderValidation,
};
