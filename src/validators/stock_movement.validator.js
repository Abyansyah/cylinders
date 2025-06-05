const { param } = require('express-validator');

const getStockMovementsForCylinderValidation = [
  param('cylinderId').isInt({ gt: 0 }).withMessage('Cylinder ID must be a positive integer.'),
];

module.exports = {
  getStockMovementsForCylinderValidation,
};