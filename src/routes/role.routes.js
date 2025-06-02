const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth.middleware');
const { createRoleValidation, updateRoleValidation } = require('../validators/role.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post(
  '/',
  authenticateJWT,
  authorizeRole('Admin'),
  createRoleValidation,
  handleValidationErrors,
  roleController.createRole
);

router.get(
  '/',
  authenticateJWT,
  authorizeRole('Admin'),
  roleController.getAllRoles
);

router.get(
  '/:id',
  authenticateJWT, 
  authorizeRole(['Admin']),
  [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer')],
  handleValidationErrors,
  roleController.getRoleById
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole('Admin'), 
  [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'), ...updateRoleValidation],
  handleValidationErrors,
  roleController.updateRole
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRole('Admin'), 
  [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer')],
  handleValidationErrors,
  roleController.deleteRole
);

module.exports = router;
