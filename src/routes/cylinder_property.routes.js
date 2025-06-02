const express = require('express');
const cylinderPropertyController = require('../controllers/cylinder_property.controller');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth.middleware');
const { createCylinderPropertyValidation, updateCylinderPropertyValidation } = require('../validators/cylinder_property.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();
const authorizedRoles = ['Admin', 'Petugas Gudang'];

router.post('/', authenticateJWT, authorizeRole(authorizedRoles), createCylinderPropertyValidation, handleValidationErrors, cylinderPropertyController.createCylinderProperty);

router.get('/', authenticateJWT, authorizeRole(authorizedRoles), cylinderPropertyController.getAllCylinderProperties);

router.get('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer')], handleValidationErrors, cylinderPropertyController.getCylinderPropertyById);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole(authorizedRoles),
  [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer'), ...updateCylinderPropertyValidation],
  handleValidationErrors,
  cylinderPropertyController.updateCylinderProperty
);

router.delete('/:id', authenticateJWT, authorizeRole(authorizedRoles), [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer')], handleValidationErrors, cylinderPropertyController.deleteCylinderProperty);

module.exports = router;
