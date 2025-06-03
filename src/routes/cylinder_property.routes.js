const express = require('express');
const cylinderPropertyController = require('../controllers/cylinder_property.controller');
const { authenticateJWT, authorizeRole, authorizePermission } = require('../middlewares/auth.middleware');
const { createCylinderPropertyValidation, updateCylinderPropertyValidation } = require('../validators/cylinder_property.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizePermission('cylinderproperty:manage'), createCylinderPropertyValidation, handleValidationErrors, cylinderPropertyController.createCylinderProperty);

router.get('/', authenticateJWT, authorizePermission('cylinderproperty:manage'), cylinderPropertyController.getAllCylinderProperties);

router.get(
  '/:id',
  authenticateJWT,
  authorizePermission('cylinderproperty:manage'),
  [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer')],
  handleValidationErrors,
  cylinderPropertyController.getCylinderPropertyById
);

router.put(
  '/:id',
  authenticateJWT,
  authorizePermission('cylinderproperty:manage'),
  [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer'), ...updateCylinderPropertyValidation],
  handleValidationErrors,
  cylinderPropertyController.updateCylinderProperty
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizePermission('cylinderproperty:manage'),
  [param('id').isInt({ gt: 0 }).withMessage('CylinderProperty ID must be a positive integer')],
  handleValidationErrors,
  cylinderPropertyController.deleteCylinderProperty
);

module.exports = router;
