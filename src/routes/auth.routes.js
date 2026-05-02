const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

// Route publique: Login & Register
router.post('/login', loginRateLimiter, authController.login);
router.post('/register', authController.register);

// Routes protégées: Configuration et vérification de la 2FA
router.post('/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/2fa/verify', authMiddleware, authController.verify2FA);

module.exports = router;
