const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const citizenAuthController = require('../controllers/citizen-auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

// Routes Agent
router.post('/login', loginRateLimiter, authController.login);
router.post('/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/2fa/verify', authMiddleware, authController.verify2FA);

// Routes Citoyen
router.post('/citizen/register', citizenAuthController.register);
router.post('/citizen/login', loginRateLimiter, citizenAuthController.login);
router.get('/me', authMiddleware, citizenAuthController.getMe);

module.exports = router;
