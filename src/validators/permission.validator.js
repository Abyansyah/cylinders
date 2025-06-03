const { body } = require('express-validator');

const createPermissionValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Permission name is required')
    .isString()
    .withMessage('Permission name must be a string')
    .isLength({ min: 3, max: 100 })
    .withMessage('Permission name must be between 3 and 100 characters')
    .matches(/^[\w-]+:[\w-]+$/)
    .withMessage('Permission name must be in format resource:action (e.g., user:create)'),
  body('description').optional().trim().isString().withMessage('Description must be a string'),
];

module.exports = {
  createPermissionValidation,
};
