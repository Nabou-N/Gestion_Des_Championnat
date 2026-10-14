const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Pensez au "s" de authControllers

router.post('/login', authController.login);

module.exports = router;
