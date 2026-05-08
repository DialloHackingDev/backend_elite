const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Toutes les routes liées aux agents sont protégées par le middleware d'authentification
router.use(authMiddleware);

// Seuls les ADMIN (ou MINISTRY selon la logique métier) peuvent créer un agent
router.post('/', rbacMiddleware(['ADMIN', 'MINISTRY']), agentController.createAgent);

// Liste des agents (réservé aux superviseurs)
router.get('/', rbacMiddleware(['ADMIN', 'MINISTRY']), agentController.getAgents);

// Détail d'un agent
router.get('/:id', rbacMiddleware(['ADMIN', 'MINISTRY']), agentController.getAgentById);

// Activer / Suspendre un agent
router.patch('/:id/status', rbacMiddleware(['ADMIN']), agentController.updateAgentStatus);

// Modifier un agent
router.put('/:id', rbacMiddleware(['ADMIN', 'MINISTRY']), agentController.updateAgent);

// Supprimer un agent
router.delete('/:id', rbacMiddleware(['ADMIN']), agentController.deleteAgent);

module.exports = router;
