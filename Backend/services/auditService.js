// services/auditService.js
const AuditLog = require('../models/auditLog');
const geoip = require('geoip-lite');

class AuditService {
  static async logAction(req, res, action, resource, additionalData = {}) {
    try {
      const startTime = Date.now();
      
      // Wait for response to complete
      return new Promise((resolve) => {
        const originalSend = res.send;
        
        res.send = function(data) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          // Parse response data if possible
          let responseData = {};
          try {
            responseData = typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            // Ignore parsing errors
          }
          
          // Get location from IP
          const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
          const geo = geoip.lookup(ip);
          
          const logData = {
            // User information
            userId: req.userProfile?._id || null,
            userEmail: req.userProfile?.email || 'anonymous',
            userRole: req.userProfile?.role || 'anonymous',
            
            // Action details
            action,
            resource,
            resourceId: additionalData.resourceId || null,
            
            // Request details
            method: req.method,
            endpoint: req.originalUrl,
            statusCode: res.statusCode,
            
            // Network information
            ip,
            userAgent: req.headers['user-agent'] || '',
            location: geo ? {
              country: geo.country,
              city: geo.city,
              latitude: geo.ll[0],
              longitude: geo.ll[1]
            } : null,
            
            // Data changes
            before: additionalData.before || null,
            after: additionalData.after || null,
            changes: additionalData.changes || [],
            
            // Security information
            sessionId: req.sessionId || null,
            twoFactorUsed: !!req.headers['x-2fa-code'],
            permissions: req.userProfile?.permissions || [],
            
            // Metadata
            duration,
            success: res.statusCode < 400,
            errorMessage: responseData.message || (res.statusCode >= 400 ? 'Request failed' : ''),
            risk: 'low' // Will be calculated automatically
          };
          
          // Log asynchronously
          AuditLog.logAction(logData).then(log => {
            resolve(log);
          }).catch(error => {
            console.error('Audit logging failed:', error);
            resolve(null);
          });
          
          originalSend.call(this, data);
        };
      });
    } catch (error) {
      console.error('Audit service error:', error);
      return null;
    }
  }
  
  static async logSecurityEvent(req, event, details = {}) {
    return this.logAction(req, {
      statusCode: 403,
      send: () => {}
    }, event, 'security', {
      ...details,
      risk: 'high'
    });
  }
  
  static async logDataChange(req, resource, resourceId, changes) {
    return this.logAction(req, {
      statusCode: 200,
      send: () => {}
    }, 'update', resource, {
      resourceId,
      changes,
      risk: 'medium'
    });
  }
  
  static async getUserActivity(userId, options = {}) {
    return AuditLog.findByUser(userId, options);
  }
  
  static async getSecurityEvents(options = {}) {
    return AuditLog.getSecurityEvents(options);
  }
  
  static async getActivitySummary(userId, startDate, endDate) {
    return AuditLog.getActivitySummary(userId, startDate, endDate);
  }
  
  static async getRiskMetrics(startDate, endDate) {
    return AuditLog.getRiskMetrics(startDate, endDate);
  }
  
  static async getAdminActivity(options = {}) {
    const { startDate, endDate, limit = 100 } = options;
    
    return AuditLog.find({
      userRole: { $in: ['admin', 'super_admin'] },
      ...(startDate && { timestamp: { $gte: startDate } }),
      ...(endDate && { timestamp: { $lte: endDate } })
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'fullName email username');
  }
  
  static async getFailedLogins(options = {}) {
    const { startDate, endDate, limit = 50 } = options;
    
    return AuditLog.find({
      action: 'login',
      success: false,
      ...(startDate && { timestamp: { $gte: startDate } }),
      ...(endDate && { timestamp: { $lte: endDate } })
    })
    .sort({ timestamp: -1 })
    .limit(limit);
  }
  
  static async getHighRiskEvents(options = {}) {
    const { startDate, endDate, limit = 50 } = options;
    
    return AuditLog.findByRisk('critical', {
      startDate,
      endDate,
      limit
    });
  }
  
  static async getAccessPatterns(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return AuditLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            hour: { $hour: "$timestamp" }
          },
          count: { $sum: 1 },
          uniqueIPs: { $addToSet: "$ip" },
          actions: { $addToSet: "$action" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          hour: "$_id.hour",
          count: 1,
          uniqueIPCount: { $size: "$uniqueIPs" },
          actionCount: { $size: "$actions" }
        }
      },
      {
        $sort: { date: -1, hour: -1 }
      }
    ]);
  }
  
  static async getComplianceReport(startDate, endDate) {
    const [
      totalActions,
      failedActions,
      highRiskEvents,
      uniqueUsers,
      uniqueIPs
    ] = await Promise.all([
      AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        success: false
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        risk: { $in: ['high', 'critical'] }
      }),
      AuditLog.distinct('userId', {
        timestamp: { $gte: startDate, $lte: endDate }
      }),
      AuditLog.distinct('ip', {
        timestamp: { $gte: startDate, $lte: endDate }
      })
    ]);
    
    return {
      period: { startDate, endDate },
      totalActions,
      failedActions,
      successRate: ((totalActions - failedActions) / totalActions * 100).toFixed(2),
      highRiskEvents,
      uniqueUsers: uniqueUsers.length,
      uniqueIPs: uniqueIPs.length
    };
  }
}

module.exports = AuditService;
