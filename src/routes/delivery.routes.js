'use strict';
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { createDeliveryValidation, completeDeliveryValidation } = require('../validators/delivery.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

router.get('/ready', authenticateJWT, authorizePermission('delivery:view_ready'), deliveryController.getOrdersReadyForDelivery);

router.post('/', authenticateJWT, authorizePermission('delivery:create'), createDeliveryValidation, handleValidationErrors, deliveryController.createDelivery);

router.get('/driver/active', authenticateJWT, authorizePermission('delivery:view_own_active'), deliveryController.getActiveDeliveriesForDriver);

router.put('/:id/pickup-from-warehouse', authenticateJWT, authorizePermission('delivery:update_pickup'), [param('id').isInt({ gt: 0 })], handleValidationErrors, deliveryController.pickupFromWarehouse);

router.put('/:id/complete-at-customer', authenticateJWT, authorizePermission('delivery:update_complete'), completeDeliveryValidation, handleValidationErrors, deliveryController.completeAtCustomer);

module.exports = router;
