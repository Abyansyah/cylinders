'use strict';
const { query } = require('express-validator');

const getCylinderHistoryReportValidation = [
  query('barcode_id').notEmpty().withMessage('barcode_id is required.'),
  query('start_date').optional().isISO8601().toDate().withMessage('Invalid start_date format.'),
  query('end_date').optional().isISO8601().toDate().withMessage('Invalid end_date format.'),
];

module.exports = {
  getCylinderHistoryReportValidation,
};
