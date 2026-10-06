const prisma = require('../config/db');
const auditService = require('../services/auditService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * List system-wide audit logs (Admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, action, entityType, userId } = req.query;
    const result = await auditService.getAdminAuditLogs({
      page,
      limit,
      action,
      entityType,
      userId,
    });
    return sendSuccess(res, 200, 'System audit logs retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Get system-wide statistics (Admin only)
 */
const getSystemStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProjects, totalTasks, totalAuditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.auditLog.count(),
    ]);

    const stats = {
      totalUsers,
      totalProjects,
      totalTasks,
      totalAuditLogs,
    };

    return sendSuccess(res, 200, 'System statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getSystemStats,
};
