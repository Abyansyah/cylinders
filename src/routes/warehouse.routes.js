// src/routes/warehouse.routes.js
const express = require('express');
const warehouseController = require('../controllers/warehouse.controller');
const { authenticateJWT, authorizeRole, authorizePermission } = require('../middlewares/auth.middleware');
const { createWarehouseValidation, updateWarehouseValidation } = require('../validators/warehouse.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizePermission('warehouse:create'), createWarehouseValidation, handleValidationErrors, warehouseController.createWarehouse);

router.get('/', authenticateJWT, authorizePermission('warehouse:view_all'), handleValidationErrors, warehouseController.getAllWarehouses);

router.get('/:id', authenticateJWT, authorizePermission('warehouse:view'), [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer')], handleValidationErrors, warehouseController.getWarehouseById);

router.put(
  '/:id',
  authenticateJWT,
  authorizePermission('warehouse:update'),
  [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer'), ...updateWarehouseValidation],
  handleValidationErrors,
  warehouseController.updateWarehouse
);

router.delete('/:id', authenticateJWT, authorizePermission('warehouse:delete'), [param('id').isInt({ gt: 0 }).withMessage('Warehouse ID must be a positive integer')], handleValidationErrors, warehouseController.deleteWarehouse);

module.exports = router;
