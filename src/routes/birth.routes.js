const express = require('express');
const router = express.Router();
const birthController = require('../controllers/birth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
const { birthSchema } = require('../validations/birth.validation');

// Route publique: Consulter un acte via son numéro
router.get('/:nationalId', birthController.getBirth);

// Route protégée: Enregistrer un acte (Seuls les Agents ou Superviseurs)
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

// Administration des naissances tardives
router.get(
  '/pending',
  authMiddleware,
  rbacMiddleware(['ADMIN', 'MINISTRY']),
  birthController.getPendingBirths
);

router.patch(
  '/:id/validate',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  birthController.validateBirth
);

module.exports = router;
