'use strict';
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { productValidation } = require('../validators/product.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

router.post('/', authenticateJWT, authorizePermission('product:manage'), productValidation, handleValidationErrors, productController.createProduct);
router.get('/', authenticateJWT, authorizePermission('product:manage'), productController.getAllProducts);
router.get('/:id', authenticateJWT, authorizePermission('product:manage'), [param('id').isInt({ gt: 0 })], handleValidationErrors, productController.getProductById);
router.put('/:id', authenticateJWT, authorizePermission('product:manage'), [param('id').isInt({ gt: 0 }), ...productValidation], handleValidationErrors, productController.updateProduct);
router.delete('/:id', authenticateJWT, authorizePermission('product:manage'), [param('id').isInt({ gt: 0 })], handleValidationErrors, productController.deleteProduct);

module.exports = router;
