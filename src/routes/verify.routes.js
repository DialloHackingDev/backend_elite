const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verify.controller');

// Route publique pour scanner un QR code
// Optionnellement, on pourrait exiger une authentification pour les institutions (hôpitaux, tribunaux)
router.post('/qr', verifyController.verifyQR);

module.exports = router;
