const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/preview', verifyToken, reportController.getReportPreview); // New Route
router.get('/download', verifyToken, reportController.generateReport);

module.exports = router;