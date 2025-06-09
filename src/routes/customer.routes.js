const express = require('express');
const customerController = require('../controllers/customer.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { createCustomerValidation, updateCustomerValidation } = require('../validators/customer.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizePermission('customer:create'), createCustomerValidation, handleValidationErrors, customerController.createCustomer);

router.get('/', authenticateJWT, authorizePermission('customer:view_all'), handleValidationErrors, customerController.getAllCustomers);

router.get('/:id', authenticateJWT, authorizePermission('customer:view'), [param('id').isInt({ gt: 0 })], handleValidationErrors, customerController.getCustomerById);

router.put('/:id', authenticateJWT, authorizePermission('customer:update'), updateCustomerValidation, handleValidationErrors, customerController.updateCustomer);

router.delete('/:id', authenticateJWT, authorizePermission('customer:delete'), [param('id').isInt({ gt: 0 })], handleValidationErrors, customerController.deleteCustomer);

module.exports = router;
