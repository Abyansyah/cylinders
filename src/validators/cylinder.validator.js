const { body, param } = require('express-validator');
const { Cylinder, User } = require('../models');
const { Op } = require('sequelize');

const cylinderStatuses = ['Di Gudang - Kosong', 'Di Gudang - Terisi', 'Dipinjam Pelanggan', 'Perlu Inspeksi', 'Rusak', 'Hilang'];
const movementTypes = ['TERIMA_BARU', 'ISI_ULANG', 'PINDAH_GUDANG', 'KELUAR_PELANGGAN', 'KEMBALI_PELANGGAN', 'UPDATE_STATUS'];

const createCylinderValidation = [
  body('barcode_ids')
    .isArray({ min: 1, max: 50 })
    .withMessage('barcode_ids must be a non-empty array with 1 to 50 items.'),

  body('barcode_ids.*')
    .trim()
    .notEmpty()
    .withMessage('Each barcode ID in the array must not be empty.')
    .isString()
    .withMessage('Each barcode ID must be a string.')
    .isLength({ max: 100 })
    .withMessage('Each barcode ID must not exceed 100 characters.'),

  body('barcode_ids').custom(async (value) => {
    const uniqueBarcodeIds = new Set(value);
    if (uniqueBarcodeIds.size !== value.length) {
      return Promise.reject('Duplicate barcode_ids found in the request array.');
    }

    const existingCylinders = await Cylinder.findAll({
      where: {
        barcode_id: {
          [Op.in]: value,
        },
      },
      attributes: ['barcode_id'],
    });

    if (existingCylinders.length > 0) {
      const existingIds = existingCylinders.map((c) => c.barcode_id).join(', ');
      return Promise.reject(`The following barcode_ids already exist in the database: ${existingIds}`);
    }
  }),

  body('cylinder_properties_id').notEmpty().withMessage('Cylinder Property ID is required.').isInt({ gt: 0 }).withMessage('Cylinder Property ID must be a positive integer.'),

  body('warehouse_id')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Warehouse ID must be a positive integer if provided.')
    .custom((value, { req }) => {
      if (req.user && req.user.role.role_name !== 'Petugas Gudang' && !value) {
        throw new Error('Warehouse ID is required in the request body for your role.');
      }
      return true;
    }),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(cylinderStatuses)
    .withMessage(`Status must be one of: ${cylinderStatuses.join(', ')}`),

  body('manufacture_date').notEmpty().withMessage('Manufacture date is required.').isISO8601().toDate().withMessage('Manufacture date must be a valid date.'),

  body('gas_type_id')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage('Gas Type ID must be a positive integer.')
    .if(body('status').equals('Di Gudang - Terisi'))
    .notEmpty()
    .withMessage('Gas Type ID is required when status is "Di Gudang - Terisi".'),

  body('last_fill_date').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Last fill date must be a valid date.'),

  body('is_owned_by_customer').optional().isBoolean().withMessage('Is owned by customer must be a boolean.'),

  body('notes').optional().trim().isString(),
];

const updateCylinderStatusValidation = [
  param('id').isInt({ gt: 0 }).withMessage('Cylinder ID must be a positive integer.'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(cylinderStatuses)
    .withMessage(`Status must be one of: ${cylinderStatuses.join(', ')}`),
  body('gas_type_id')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage('Gas Type ID must be a positive integer.')
    .if(body('status').equals('Di Gudang - Terisi'))
    .notEmpty()
    .withMessage('Gas Type ID is required when status is "Di Gudang - Terisi".')
    .bail()
    .custom((value, { req }) => {
      // If status is 'Di Gudang - Kosong', gas_type_id should be nullified or ignored
      if (req.body.status === 'Di Gudang - Kosong' && value) {
        // This custom validator might be better handled in controller logic
        // to explicitly set gas_type_id to null if status is empty.
        // For now, just ensure it's an int if provided.
      }
      return true;
    }),
  body('last_fill_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Last fill date must be a valid date.')
    .if(body('status').equals('Di Gudang - Terisi'))
    .notEmpty()
    .withMessage('Last fill date is required when status is "Di Gudang - Terisi".'),
  body('notes').optional().trim().isString(),
  body('warehouse_id').optional().isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer.'),
];

const bulkCreateCylindersValidation = [
  body().isArray({ min: 1, max: 50 }).withMessage('Request body must be an array of cylinders with 1 to 50 items.'),

  body('*.barcode_id').trim().notEmpty().withMessage('Barcode ID is required for each cylinder.').isString().withMessage('Barcode ID must be a string.').isLength({ max: 100 }).withMessage('Barcode ID must not exceed 100 characters.'),

  body('*.cylinder_properties_id').notEmpty().withMessage('Cylinder Property ID is required for each cylinder.').isInt({ gt: 0 }).withMessage('Cylinder Property ID must be a positive integer.'),

  body('*.warehouse_id').optional().isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer if provided.'),

  body('*.status')
    .trim()
    .notEmpty()
    .withMessage('Status is required for each cylinder.')
    .isIn(cylinderStatuses)
    .withMessage(`Status must be one of: ${cylinderStatuses.join(', ')}`),

  body('*.manufacture_date').notEmpty().withMessage('Manufacture date is required for each cylinder.').isISO8601().toDate().withMessage('Manufacture date must be a valid date.'),

  body('*.gas_type_id')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage('Gas Type ID must be a positive integer.')
    .custom((value, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      const status = req.body[index].status;
      if (status === 'Di Gudang - Terisi' && !value) {
        throw new Error('Gas Type ID is required when status is "Di Gudang - Terisi".');
      }
      return true;
    }),

  body('*.last_fill_date').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Last fill date must be a valid date.'),

  body('*.is_owned_by_customer').optional().isBoolean(),
  body('*.notes').optional().trim().isString(),

  body().custom(async (cylindersArray, { req }) => {
    const barcodeIds = cylindersArray.map((c) => c.barcode_id);
    const uniqueBarcodeIds = new Set(barcodeIds);
    if (uniqueBarcodeIds.size !== barcodeIds.length) {
      throw new Error('Duplicate barcode_ids found in the batch.');
    }
    const existingCylinders = await Cylinder.findAll({
      where: { barcode_id: { [Op.in]: barcodeIds } },
      attributes: ['barcode_id'],
    });
    if (existingCylinders.length > 0) {
      const existingBarcodeIds = existingCylinders.map((c) => c.barcode_id).join(', ');
      throw new Error(`Some barcode_ids already exist in the database: ${existingBarcodeIds}`);
    }
    return true;
  }),
];

const getCylinderByBarcodeValidation = [param('barcode_id').trim().notEmpty().withMessage('Barcode ID is required.')];

const bulkUpdateCylindersStatusValidation = [
  body().isArray({ min: 1, max: 50 }).withMessage('Request body must be an array of cylinder updates with 1 to 50 items.'),

  body('*.id').optional().isInt({ gt: 0 }).withMessage('Cylinder ID must be a positive integer if provided.'),
  body('*.barcode_id').optional().isString().notEmpty().withMessage('Barcode ID must be a non-empty string if provided.'),

  body().custom((updatesArray) => {
    for (let i = 0; i < updatesArray.length; i++) {
      const item = updatesArray[i];
      if (!item.id && !item.barcode_id) {
        throw new Error(`Each cylinder update item (at index ${i}) must have either an 'id' or a 'barcode_id'.`);
      }
    }
    return true;
  }),

  body('*.status')
    .trim()
    .notEmpty()
    .withMessage('Status is required for each cylinder update.')
    .isIn(cylinderStatuses)
    .withMessage(`Status must be one of: ${cylinderStatuses.join(', ')}`),

  body('*.gas_type_id')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage('Gas Type ID must be a positive integer.')
    .custom((value, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      const status = req.body[index].status;
      if (status === 'Di Gudang - Terisi' && !value) {
        throw new Error('Gas Type ID is required when status is "Di Gudang - Terisi".');
      }
      return true;
    }),

  body('*.last_fill_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Last fill date must be a valid date.')
    .custom((value, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      const status = req.body[index].status;
      if (status === 'Di Gudang - Terisi' && !value) {
      }
      return true;
    }),

  body('*.notes').optional().trim().isString(),
  body('*.warehouse_id_param').optional().isInt({ gt: 0 }).withMessage('Target Warehouse ID must be a positive integer if provided.'),
];

module.exports = {
  createCylinderValidation,
  updateCylinderStatusValidation,
  getCylinderByBarcodeValidation,
  cylinderStatuses,
  movementTypes,
  bulkCreateCylindersValidation,
  bulkUpdateCylindersStatusValidation,
};
