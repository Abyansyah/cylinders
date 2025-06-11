'use strict';
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const { getCylinderHistoryReportValidation } = require('../validators/report.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');

router.get('/cylinder-history', authenticateJWT, authorizePermission('report:view_cylinder_history'), getCylinderHistoryReportValidation, handleValidationErrors, reportController.getCylinderHistoryReport);

module.exports = router;
