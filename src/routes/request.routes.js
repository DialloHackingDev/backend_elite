const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

// Toutes les routes sont protégées
router.use(authMiddleware);

// Routes citoyens
router.get('/my-requests', rbacMiddleware(['CITIZEN', 'ADMIN']), requestController.getMyRequests);
router.post('/', rbacMiddleware(['CITIZEN', 'ADMIN']), requestController.createRequest);
router.get('/:id', rbacMiddleware(['CITIZEN', 'ADMIN']), requestController.getRequestDetails);
router.delete('/:id', rbacMiddleware(['CITIZEN', 'ADMIN']), requestController.cancelRequest);

module.exports = router;
