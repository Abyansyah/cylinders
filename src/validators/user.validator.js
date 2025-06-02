const { body } = require('express-validator');

const registerUserValidation = [
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('phone_number').trim().optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number format'),
  body('role_name').trim().optional().isString().withMessage('Role name must be a string'),
];

const loginUserValidation = [body('username').trim().notEmpty().withMessage('Username is required'), body('password').notEmpty().withMessage('Password is required')];

const createUserValidation = [
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('phone_number').trim().optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number format'),
  body('role_id').notEmpty().withMessage('Role ID is required').isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const updateUserValidation = [
  body('username').trim().optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('name').trim().optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('phone_number').trim().optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number format'),
  body('role_id').optional().isInt({ gt: 0 }).withMessage('Role ID must be a positive integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

module.exports = {
  registerUserValidation,
  loginUserValidation,
  createUserValidation,
  updateUserValidation,
};
