// src/routes/systemRoutes.js
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Use existing upload middleware

// Only Admins can Backup/Restore
router.get('/backup', verifyToken, isAdmin, systemController.createBackup);
router.post('/restore', verifyToken, isAdmin, upload.single('backup_file'), systemController.restoreBackup);

module.exports = router;