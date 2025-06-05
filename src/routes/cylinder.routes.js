const express = require('express');
const cylinderController = require('../controllers/cylinder.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { createCylinderValidation, updateCylinderStatusValidation, bulkCreateCylindersValidation, bulkUpdateCylindersStatusValidation } = require('../validators/cylinder.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizePermission('cylinder:create'), createCylinderValidation, handleValidationErrors, cylinderController.createCylinder);

router.get('/', authenticateJWT, authorizePermission('cylinder:view_all'), cylinderController.getAllCylinders);

router.get('/summary', authenticateJWT, authorizePermission('cylinder:view_summary'), cylinderController.getStockSummary);

router.get('/details/:identifier', authenticateJWT, authorizePermission('cylinder:view'), cylinderController.getCylinderDetails);

router.put('/:id/status', authenticateJWT, authorizePermission('cylinder:update_status'), updateCylinderStatusValidation, handleValidationErrors, cylinderController.updateCylinderStatus);

router.post('/bulk', authenticateJWT, authorizePermission('cylinder:create_bulk'), bulkCreateCylindersValidation, handleValidationErrors, cylinderController.bulkCreateCylinders);

router.put(
  '/bulk/status',
  authenticateJWT,
  authorizePermission('cylinder:update_status_bulk'),
  bulkUpdateCylindersStatusValidation, 
  handleValidationErrors,
  cylinderController.bulkUpdateCylindersStatus
);

module.exports = router;
