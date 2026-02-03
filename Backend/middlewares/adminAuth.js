// middlewares/adminAuth.js
const { requireAdmin, logAdminAction } = require('./roleBasedAuth');
const AuditService = require('../services/auditService');

// Enhanced admin authentication with audit logging
const adminAuth = async (req, res, next) => {
  try {
    // Use the new requireAdmin middleware
    return requireAdmin(req, res, next);
  } catch (error) {
    // Log failed admin access attempt
    await AuditService.logSecurityEvent(req, 'access_denied', {
      resource: 'admin_panel',
      errorMessage: error.message
    });
    
    return res.status(error.status || 403).json({
      success: false,
      message: error.message || "Admin access required"
    });
  }
};

// Admin authentication with action logging
const adminAuthWithLogging = (action) => {
  return async (req, res, next) => {
    try {
      // First authenticate as admin
      await requireAdmin(req, res, () => {});
      
      // Log the admin action
      await logAdminAction(action)(req, res, next);
    } catch (error) {
      // Log failed admin access attempt
      await AuditService.logSecurityEvent(req, 'access_denied', {
        resource: 'admin_panel',
        action,
        errorMessage: error.message
      });
      
      return res.status(error.status || 403).json({
        success: false,
        message: error.message || "Admin access required"
      });
    }
  };
};

module.exports = { adminAuth, adminAuthWithLogging };
