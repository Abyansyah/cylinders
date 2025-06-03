const express = require('express');
const gasTypeController = require('../controllers/gas_type.controller');
const { authenticateJWT, authorizePermission,  } = require('../middlewares/auth.middleware');
const { createGasTypeValidation, updateGasTypeValidation } = require('../validators/gas_type.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();


router.post('/', authenticateJWT, authorizePermission('gastype:manage'), createGasTypeValidation, handleValidationErrors, gasTypeController.createGasType);

router.get('/', authenticateJWT, authorizePermission('gastype:manage'), handleValidationErrors, gasTypeController.getAllGasTypes);

router.get('/:id', authenticateJWT, authorizePermission('gastype:manage'), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer')], handleValidationErrors, gasTypeController.getGasTypeById);

router.put('/:id', authenticateJWT, authorizePermission('gastype:manage'), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer'), ...updateGasTypeValidation], handleValidationErrors, gasTypeController.updateGasType);

router.delete('/:id', authenticateJWT, authorizePermission('gastype:manage'), [param('id').isInt({ gt: 0 }).withMessage('GasType ID must be a positive integer')], handleValidationErrors, gasTypeController.deleteGasType);

module.exports = router;
