const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protect all admin routes: require authentication + ADMIN role
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/system-stats', adminController.getSystemStats);

module.exports = router;
