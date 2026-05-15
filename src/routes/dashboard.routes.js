const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Routes publiques pour les statistiques globales
router.get('/kpis', dashboardController.getKPIs);
router.get('/stats', dashboardController.getKPIs); // alias pour le mobile
router.get('/trends', dashboardController.getTrends);

// Toutes les autres routes du dashboard sont protégées et réservées aux ministères et admins
router.use(authMiddleware, rbacMiddleware(['ADMIN', 'MINISTRY']));

// Routes de données pour le dashboard admin
router.get('/agents', dashboardController.getAgents);
router.get('/network', dashboardController.getNetworkStatus);
router.get('/audit', dashboardController.getAuditLog);
router.get('/map', dashboardController.getMapData);
router.get('/export/csv', dashboardController.exportCSV);

module.exports = router;
