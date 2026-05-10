const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verify.controller');

// Route publique pour scanner un QR code
router.post('/qr', verifyController.verifyQR);

// Route publique pour vérifier via ID National manuel
router.post('/id', verifyController.verifyId);

// Route publique pour visualiser le document certifié au format PDF
router.get('/document/:nationalId', verifyController.getDocument);

module.exports = router;
