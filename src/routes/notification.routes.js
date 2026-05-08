const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

// Routes pour citoyens
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

// Routes pour agents
router.get('/citizens', notificationController.listCitizens);
router.get('/agents', notificationController.listAgents);
router.post('/send', notificationController.sendToCitizen);

module.exports = router;
