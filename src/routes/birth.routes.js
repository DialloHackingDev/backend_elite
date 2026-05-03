const express = require('express');
const router = express.Router();
const birthController = require('../controllers/birth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
const { birthSchema } = require('../validations/birth.validation');

// Route protégée: Liste des naissances de l'agent connecté (avec pagination)
router.get(
  '/',
  authMiddleware,
  rbacMiddleware(['AGENT', 'ADMIN', 'MINISTRY']),
  birthController.getBirths
);

// Administration des naissances tardives — DOIT être avant /:nationalId
router.get(
  '/pending',
  authMiddleware,
  rbacMiddleware(['ADMIN', 'MINISTRY']),
  birthController.getPendingBirths
);

// Route publique: Consulter un acte via son numéro national
router.get('/:nationalId', birthController.getBirth);

// Route protégée: Enregistrer un acte
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['AGENT', 'ADMIN', 'MINISTRY']),
  validateBody(birthSchema),
  birthController.registerBirth
);

// Route protégée: Synchronisation par lot (Mode Hors-Ligne)
router.post(
  '/sync',
  authMiddleware,
  rbacMiddleware(['AGENT', 'ADMIN', 'MINISTRY']),
  birthController.syncBirths
);

router.patch(
  '/:id/validate',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  birthController.validateBirth
);

module.exports = router;
