const express = require('express');
const authController = require('../controllers/auth.controller');
const { registerUserValidation, loginUserValidation } = require('../validators/user.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { authenticateJWT } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerUserValidation, handleValidationErrors, authController.register);
router.post('/login', loginUserValidation, handleValidationErrors, authController.login);
router.get('/me', authenticateJWT, authController.getProfile);

module.exports = router;
