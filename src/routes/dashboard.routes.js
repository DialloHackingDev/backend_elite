const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Route publique pour les statistiques globales (Landing Page + Mobile Dashboard)
router.get('/kpis', dashboardController.getKPIs);
router.get('/stats', dashboardController.getKPIs); // alias pour le mobile

// Toutes les autres routes du dashboard sont protégées et réservées aux ministères et admins
router.use(authMiddleware, rbacMiddleware(['ADMIN', 'MINISTRY']));

router.get('/map', dashboardController.getMapData);
router.get('/export/csv', dashboardController.exportCSV);

module.exports = router;
