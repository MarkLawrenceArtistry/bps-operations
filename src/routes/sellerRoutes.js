const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', verifyToken, upload.single('image'), sellerController.createSeller);
router.get('/', verifyToken, sellerController.getAllSeller);
router.delete('/:id', verifyToken, sellerController.deleteSeller);
router.put('/:id', verifyToken, upload.single('image'), sellerController.updateSeller);
router.get('/:id', verifyToken, sellerController.getSeller);

module.exports = router;