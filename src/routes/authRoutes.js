const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Pensez au "s" de authControllers

const verifyToken = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.me);

module.exports = router;
