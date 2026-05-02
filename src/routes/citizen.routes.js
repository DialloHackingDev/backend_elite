const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Toutes les routes citoyennes sont protégées
router.use(authMiddleware);

// Uniquement pour les citoyens (ou les admins pour support)
router.get('/my-children', rbacMiddleware(['CITIZEN', 'ADMIN']), citizenController.getMyChildrenBirths);
router.get('/certificate/:birthId', rbacMiddleware(['CITIZEN', 'ADMIN']), citizenController.downloadCertificate);

module.exports = router;
