const express = require('express');
const stockMovementController = require('../controllers/stock_movement.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { getStockMovementsForCylinderValidation } = require('../validators/stock_movement.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.get('/', authenticateJWT, authorizePermission('stockmovement:view_all'), stockMovementController.getAllStockMovements);

router.get('/cylinder/:cylinderId', authenticateJWT, authorizePermission('stockmovement:view_all'), getStockMovementsForCylinderValidation, handleValidationErrors, stockMovementController.getAllStockMovements);

router.get(
  '/:id',
  authenticateJWT,
  authorizePermission('stockmovement:view'),
  [param('id').isInt({ gt: 0 }).withMessage('Stock Movement ID must be a positive integer')],
  handleValidationErrors,
  stockMovementController.getStockMovementById
);

module.exports = router;
