const { body, param, query } = require('express-validator');
const { Customer, User, CylinderProperty, GasType } = require('../models');

const orderTypes = ['Sewa', 'Beli'];
const orderStatuses = ['Baru', 'Dikonfirmasi Sales', 'Dibatalkan Sales', 'Disiapkan Gudang', 'Siap Kirim', 'Dikirim', 'Selesai', 'Dibatalkan Sistem'];
const assignmentStatuses = ['Dialokasikan', 'Dikirim', 'Diterima Pelanggan', 'Dikembalikan Gudang', 'Selesai Rental'];

const createOrderValidation = [
  body('customer_id').notEmpty().withMessage('Customer ID is required.').isInt({ gt: 0 }).withMessage('Customer ID must be a positive integer.'),
  // .custom(async (value) => {
  //   const customer = await Customer.findByPk(value);
  //   if (!customer) return Promise.reject('Customer not found.');
  // }),
  body('assigned_warehouse_id').notEmpty().withMessage('Assigned warehouse ID is required.').isInt({ gt: 0 }).withMessage('Assigned warehouse ID must be a positive integer.'),
  body('order_type')
    .trim()
    .notEmpty()
    .withMessage('Order type is required.')
    .isIn(orderTypes)
    .withMessage(`Order type must be one of: ${orderTypes.join(', ')}`),
  body('shipping_address').trim().notEmpty().withMessage('Shipping address is required.'),
  body('notes_customer').optional({ checkFalsy: true }).trim().isString(),
  body('notes_internal').optional({ checkFalsy: true }).trim().isString(),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item.'),
  body('items.*.cylinder_properties_id').notEmpty().withMessage('Item cylinder_properties_id is required.').isInt({ gt: 0 }).withMessage('Item cylinder_properties_id must be a positive integer.'),
  body('items.*.gas_type_id').notEmpty().withMessage('Item gas_type_id is required.').isInt({ gt: 0 }).withMessage('Item gas_type_id must be a positive integer.'),
  body('items.*.quantity').notEmpty().withMessage('Item quantity is required.').isInt({ gt: 0 }).withMessage('Item quantity must be a positive integer.'),
  body('items.*.unit_price').notEmpty().withMessage('Item unit_price is required.').isFloat({ gt: 0 }).withMessage('Item unit_price must be a positive number.'),
  body('items.*.is_rental').optional().isBoolean().withMessage('Item is_rental must be a boolean.'),
  body('items.*.rental_start_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Item rental_start_date must be a valid date.')
    .custom((value, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      if (req.body.items[index].is_rental && !value) {
        throw new Error('Rental start date is required for rental items.');
      }
      return true;
    }),
  body('items.*.rental_end_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Item rental_end_date must be a valid date.')
    .custom((value, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      if (req.body.items[index].is_rental && !value) {
        throw new Error('Rental end date is required for rental items.');
      }
      if (value && req.body.items[index].rental_start_date && new Date(value) < new Date(req.body.items[index].rental_start_date)) {
        throw new Error('Rental end date must be after rental start date for item.');
      }
      return true;
    }),
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
};
