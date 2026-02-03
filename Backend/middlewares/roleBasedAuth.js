// middlewares/roleBasedAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Enhanced authentication middleware with session management
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ 
        success: false, 
        message: "Authorization required" 
      });
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid authorization format" 
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both token formats - some use 'id', others use 'userId'
    const userId = decoded.id || decoded.userId;
    
    // Get user with full profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        success: false, 
        message: "Account temporarily locked due to failed login attempts" 
      });
    }

    // Update session activity
    const sessionId = req.headers['x-session-id'] || 'default';
    await user.updateSessionActivity(sessionId);

    // Attach user to request
    req.user = decoded;
    req.userProfile = user;
    req.sessionId = sessionId;
    
    // Normalize role for backward compatibility
    if (user.role === 'user') {
      user.role = 'trial';
    }
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

// Permission-based middleware
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.userProfile) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }

      // Check if user has the required permission
      if (!req.userProfile.hasPermission(resource, action)) {
        return res.status(403).json({ 
          success: false, 
          message: `Insufficient permissions for ${action} on ${resource}` 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Permission check failed" 
      });
    }
  };
};

// Role-based middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userProfile) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const userRole = req.userProfile.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Admin-level middleware
const requireAdmin = requireRole('admin');

// Also allow users with 'user' role to be treated as 'trial' for backward compatibility
const normalizeRole = (req, res, next) => {
  if (req.userProfile && req.userProfile.role === 'user') {
    req.userProfile.role = 'trial';
  }
  next();
};

// Super admin only middleware
const requireSuperAdmin = requireRole('super_admin');

// Enhanced admin authentication with 2FA check
const requireAdminWith2FA = async (req, res, next) => {
  try {
    // First check if user is admin
    await requireAdmin(req, res, () => {});

    // Check if 2FA is enabled and required
    const user = req.userProfile;
    if (user.adminProfile.twoFactorEnabled && !req.headers['x-2fa-code']) {
      return res.status(401).json({ 
        success: false, 
        message: "Two-factor authentication required",
        requires2FA: true 
      });
    }

    // If 2FA code is provided, verify it (implement 2FA verification logic)
    if (req.headers['x-2fa-code']) {
      // TODO: Implement 2FA verification
      // const isValid2FA = await verify2FACode(user, req.headers['x-2fa-code']);
      // if (!isValid2FA) {
      //   return res.status(401).json({ 
      //     success: false, 
      //     message: "Invalid two-factor authentication code" 
      //   });
      // }
    }

    next();
  } catch (error) {
    // If requireAdmin throws an error, let it propagate
    if (error.status) {
      return res.status(error.status).json(error);
    }
    return res.status(500).json({ 
      success: false, 
      message: "Admin authentication failed" 
    });
  }
};

// Session timeout middleware for admins
const requireActiveSession = (req, res, next) => {
  if (!req.userProfile) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }

  const user = req.userProfile;
  
  // Check if user has admin role for session timeout
  if (['admin', 'super_admin'].includes(user.role)) {
    const sessionTimeout = user.adminProfile.sessionTimeout;
    const lastActivity = user.activity.lastActive;
    
    if (Date.now() - lastActivity.getTime() > sessionTimeout) {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired due to inactivity",
        sessionExpired: true 
      });
    }
  }

  next();
};

// IP-based access control for sensitive operations
const requireIPWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied from this IP address" 
      });
    }

    next();
  };
};

// Department-based access control
const requireDepartment = (...departments) => {
  return (req, res, next) => {
    if (!req.userProfile) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const user = req.userProfile;
    
    // Super admin bypasses department restrictions
    if (user.role === 'super_admin') {
      return next();
    }

    if (!user.adminProfile.department || !departments.includes(user.adminProfile.department)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required department: ${departments.join(' or ')}` 
      });
    }

    next();
  };
};

// Access level based middleware
const requireAccessLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.userProfile) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const user = req.userProfile;
    
    // Super admin bypasses access level restrictions
    if (user.role === 'super_admin') {
      return next();
    }

    if (!user.adminProfile || user.adminProfile.accessLevel < minLevel) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required access level: ${minLevel}` 
      });
    }

    next();
  };
};

// Middleware to log admin actions
const logAdminAction = (action, resource) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // TODO: Implement proper audit logging
      // AuditLog.create({
      //   adminId: req.userProfile._id,
      //   adminEmail: req.userProfile.email,
      //   action: action,
      //   resource: resource,
      //   method: req.method,
      //   url: req.originalUrl,
      //   statusCode: res.statusCode,
      //   timestamp: new Date()
      // });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticate,
  requirePermission,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireAdminWith2FA,
  requireActiveSession,
  requireIPWhitelist,
  requireDepartment,
  requireAccessLevel,
  logAdminAction,
  normalizeRole
};
