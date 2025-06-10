'use strict';
const express = require('express');
const router = express.Router();
const returnedCylinderController = require('../controllers/returned_cylinder.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { pickupEmptyCylinderValidation, receiveReturnedCylindersValidation } = require('../validators/returned_cylinder.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');

router.post('/driver/pickup', authenticateJWT, authorizePermission('cylinder:return_pickup'), pickupEmptyCylinderValidation, handleValidationErrors, returnedCylinderController.pickupEmptyCylinders);

router.get('/warehouse/incoming', authenticateJWT, authorizePermission('warehouse:view_incoming_returns'), handleValidationErrors, returnedCylinderController.getIncomingReturnsForWarehouse);

router.post('/warehouse/receive', authenticateJWT, authorizePermission('warehouse:receive_returns'), receiveReturnedCylindersValidation, handleValidationErrors, returnedCylinderController.receiveReturnedCylinders);

module.exports = router;
