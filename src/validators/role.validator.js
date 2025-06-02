const { body } = require('express-validator');

const createRoleValidation = [body('role_name').trim().notEmpty().withMessage('Role name is required').isString().isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')];

const updateRoleValidation = [body('role_name').trim().notEmpty().withMessage('Role name is required').isString().isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
};
