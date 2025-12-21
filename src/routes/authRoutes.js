const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/', verifyToken, isAdmin, authController.getAllUsers);
router.post('/', verifyToken, isAdmin, authController.createUser);
router.put('/:id', verifyToken, isAdmin, authController.updateUser);
router.delete('/:id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;