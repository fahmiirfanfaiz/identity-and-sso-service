/**
 * Authorization Middleware
 * Restricts access to users with specific roles.
 */
'use strict';

/**
 * @param {string[]} allowedRoles - Array of roles permitted to access the route
 * @returns {Function} Express middleware
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = authorize;
