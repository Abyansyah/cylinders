const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validator.middleware');

router.post('/', authenticateJWT, authorizePermission('permission:create'), handleValidationErrors, permissionController.createPermission);
router.get('/', authenticateJWT, authorizePermission('permission:read'), handleValidationErrors, permissionController.getAllPermissions);

module.exports = router;
