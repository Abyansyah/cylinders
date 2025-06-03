const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { createUserValidation, updateUserValidation } = require('../validators/user.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizePermission('user:create'), createUserValidation, handleValidationErrors, userController.createUser);

router.get('/', authenticateJWT, authorizePermission('user:view_all'), handleValidationErrors, userController.getAllUsers);

router.get(
  '/:id',
  authenticateJWT,
  authorizePermission('user:view'),
  [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer')],
  handleValidationErrors,
  userController.getUserById
);

router.put(
  '/:id',
  authenticateJWT,
  authorizePermission('user:update'),
  [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer'), ...updateUserValidation],
  handleValidationErrors,
  userController.updateUser
);

router.delete('/:id', authenticateJWT, authorizePermission('user:delete'), [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer')], handleValidationErrors, userController.deleteUser);

module.exports = router;
