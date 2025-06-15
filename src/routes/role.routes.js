const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { createRoleValidation, updateRoleValidation } = require('../validators/role.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param, body } = require('express-validator');

const router = express.Router();

router.get('/selection', authenticateJWT, roleController.getRolesForSelection);

router.post('/', authenticateJWT, authorizePermission('role:create'), createRoleValidation, handleValidationErrors, roleController.createRole);

router.get('/', authenticateJWT, authorizePermission('role:view_all'), roleController.getAllRoles);

router.get('/:id', authenticateJWT, authorizePermission('role:view'), [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer')], handleValidationErrors, roleController.getRoleById);

router.put('/:id', authenticateJWT, authorizePermission('role:update'), [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'), ...updateRoleValidation], handleValidationErrors, roleController.updateRole);

router.delete('/:id', authenticateJWT, authorizePermission('role:delete'), [param('id').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer')], handleValidationErrors, roleController.deleteRole);

router.post(
  '/:roleId/permissions/:permissionId',
  authenticateJWT,
  authorizePermission('user:manage_roles'),
  [param('roleId').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'), param('permissionId').isInt({ gt: 0 }).withMessage('Permission ID must be a positive integer')],
  handleValidationErrors,
  roleController.assignPermissionToRole
);

router.delete(
  '/:roleId/permissions/:permissionId',
  authenticateJWT,
  authorizePermission('user:manage_roles'),
  [param('roleId').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'), param('permissionId').isInt({ gt: 0 }).withMessage('Permission ID must be a positive integer')],
  handleValidationErrors,
  roleController.revokePermissionFromRole
);

router.get(
  '/:roleId/permissions',
  authenticateJWT,
  authorizePermission('user:manage_roles'),
  [param('roleId').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer')],
  handleValidationErrors,
  roleController.getPermissionsForRole
);

router.put(
  '/:roleId/permissions',
  authenticateJWT,
  authorizePermission('ROLE_MANAGE_PERMISSIONS'),
  [
    param('roleId').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer.'),
    body('permissionIds')
      .isArray()
      .withMessage('permissionIds must be an array.')
      .custom((ids) => ids.every((id) => Number.isInteger(id) && id > 0))
      .withMessage('Each permission ID in permissionIds must be a positive integer.')
      .optional({ checkFalsy: true }),
  ],
  handleValidationErrors,
  roleController.syncPermissionsForRole
);

module.exports = router;
