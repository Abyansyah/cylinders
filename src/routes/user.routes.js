const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth.middleware');
const { createUserValidation, updateUserValidation } = require('../validators/user.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.post('/', authenticateJWT, authorizeRole('Admin'), createUserValidation, handleValidationErrors, userController.createUser);

router.get('/', authenticateJWT, authorizeRole(['Admin', 'Sales']), userController.getAllUsers);

router.get(
  '/:id',
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role.role_name === 'Admin' || req.user.role.role_name === 'Sales') {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: You can only view your own profile or you need Admin rights.' });
  },
  [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer')],
  handleValidationErrors,
  userController.getUserById
);

router.put(
  '/:id',
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role.role_name === 'Admin' || req.user.id === parseInt(req.params.id)) {
      if (req.user.role.role_name !== 'Admin' && (req.body.role_id || req.body.is_active !== undefined)) {
        return res.status(403).json({ message: 'Forbidden: You cannot change your role or active status.' });
      }
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile or you need Admin rights.' });
  },
  [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer'), ...updateUserValidation],
  handleValidationErrors,
  userController.updateUser
);

router.delete('/:id', authenticateJWT, authorizeRole('Admin'), [param('id').isInt({ gt: 0 }).withMessage('User ID must be a positive integer')], handleValidationErrors, userController.deleteUser);

module.exports = router;
