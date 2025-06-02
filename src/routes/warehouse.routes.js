// src/routes/warehouse.routes.js
const express = require('express');
const warehouseController = require('../controllers/warehouse.controller');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth.middleware');
const { createWarehouseValidation, updateWarehouseValidation } = require('../validators/warehouse.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();
const authorizedRoles = ['Admin'];

router.post('/', authenticateJWT, authorizeRole(authorizedRoles), createWarehouseValidation, handleValidationErrors, warehouseController.createWarehouse);

router.get('/', authenticateJWT, authorizeRole(['Admin', 'Petugas Gudang', 'Sales']), warehouseController.getAllWarehouses);

router.get('/:id', authenticateJWT, authorizeRole(['Admin', 'Petugas Gudang', 'Sales']), [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer')], handleValidationErrors, warehouseController.getWarehouseById);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole(authorizedRoles),
  [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer'), ...updateWarehouseValidation],
  handleValidationErrors,
  warehouseController.updateWarehouse
);

router.delete('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer')], handleValidationErrors, warehouseController.deleteWarehouse);

module.exports = router;
