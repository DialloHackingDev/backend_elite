const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Toutes les routes citoyennes sont protégées
router.use(authMiddleware);

// Uniquement pour les citoyens (ou les admins pour support)
router.get('/my-children', rbacMiddleware(['CITIZEN', 'ADMIN']), citizenController.getMyChildrenBirths);

// Chercher un acte par nationalId (ex: GN-2026-MAL-8888333)
router.get('/birth/:nationalId', rbacMiddleware(['CITIZEN', 'ADMIN']), citizenController.getBirthByNationalId);

// Télécharger le PDF — accepte un birthId (UUID) ou un nationalId (GN-...)
router.get('/certificate/:birthId', rbacMiddleware(['CITIZEN', 'ADMIN']), citizenController.downloadCertificate);

module.exports = router;
