const prisma = require('../config/db');

// List of sensitive keys that should NEVER be logged in metadata
const SENSITIVE_KEYS = [
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'jwt',
  'authorization',
  'secret',
];

const sanitizeMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return meta;
  const sanitized = { ...meta };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeMetadata(sanitized[key]);
    }
  }
  return sanitized;
};

/**
 * Record an audit log event
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID (optional for failed logins or system events)
 * @param {string} params.action - Action performed (e.g., LOGIN, LOGOUT, CREATE, UPDATE, DELETE, COMPLETE)
 * @param {string} params.entityType - Target entity type (e.g., USER, PROJECT, TASK)
 * @param {string} [params.entityId] - ID of the modified entity
 * @param {Object} [params.metadata] - Non-sensitive context data
 */
const logAction = async ({ userId, action, entityType, entityId, metadata }) => {
  try {
    const cleanMetadata = metadata ? sanitizeMetadata(metadata) : null;
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        metadata: cleanMetadata,
      },
    });
  } catch (error) {
    // Non-blocking: Audit logging errors should not crash main transactions
    console.error('Audit Log Error:', error.message);
    return null;
  }
};

/**
 * Get audit logs for the authenticated user
 */
const getUserAuditLogs = async (userId, { page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: { userId } }),
    prisma.auditLog.findMany({
      where: { userId },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get system-wide audit logs (Admin only)
 */
const getAdminAuditLogs = async ({ page = 1, limit = 20, action, entityType, userId } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

module.exports = {
  logAction,
  getUserAuditLogs,
  getAdminAuditLogs,
};
