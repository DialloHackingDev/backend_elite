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

// Routes admin/agent
router.get('/pending/all', rbacMiddleware(['ADMIN', 'MINISTRY', 'AGENT']), requestController.getAllRequests);
router.patch('/:id/status', rbacMiddleware(['ADMIN', 'MINISTRY', 'AGENT']), requestController.updateRequestStatus);
router.post('/:id/validate', rbacMiddleware(['ADMIN', 'MINISTRY', 'AGENT']), requestController.validateRequest);

module.exports = router;
