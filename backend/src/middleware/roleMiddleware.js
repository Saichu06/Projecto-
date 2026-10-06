const ApiError = require('../utils/errors');

/**
 * Role-Based Access Control middleware
 * @param  {...string} allowedRoles - Array of allowed roles (e.g., 'ADMIN', 'USER')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
};
