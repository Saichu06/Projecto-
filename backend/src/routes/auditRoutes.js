const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const authMiddleware = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/apiResponse');

router.use(authMiddleware);

// Get current user's own audit logs
router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await auditService.getUserAuditLogs(req.user.id, { page, limit });
    return sendSuccess(res, 200, 'User audit logs retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
