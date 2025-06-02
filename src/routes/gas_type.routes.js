const express = require('express');
const gasTypeController = require('../controllers/gas_type.controller');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth.middleware');
const { createGasTypeValidation, updateGasTypeValidation } = require('../validators/gas_type.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

const authorizedRoles = ['Admin', 'Petugas Gudang'];

router.post('/', authenticateJWT, authorizeRole(authorizedRoles), createGasTypeValidation, handleValidationErrors, gasTypeController.createGasType);

router.get('/', authenticateJWT, authorizeRole(authorizedRoles), gasTypeController.getAllGasTypes);

router.get('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer')], handleValidationErrors, gasTypeController.getGasTypeById);

router.put('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer'), ...updateGasTypeValidation], handleValidationErrors, gasTypeController.updateGasType);

router.delete('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer')], handleValidationErrors, gasTypeController.deleteGasType);

module.exports = router;
