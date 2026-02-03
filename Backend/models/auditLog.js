// models/auditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'create', 'read', 'update', 'delete',
      'manage', 'export', 'import', 'approve', 'reject', 'ban',
      'unban', 'reset_password', 'change_role', 'assign_permissions',
      'access_denied', 'security_violation', 'data_export', 'system_change'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'daily_challenges', 'users', 'analytics', 'content', 'payments',
      'settings', 'reports', 'moderation', 'system', 'security', 'sessions'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Request details
  method: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  
  // Network information
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  
  // Data changes
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // Security information
  sessionId: {
    type: String,
    default: null
  },
  twoFactorUsed: {
    type: Boolean,
    default: false
  },
  permissions: [{
    resource: String,
    action: String
  }],
  
  // Metadata
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  success: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String,
    default: ''
  },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // System information
  timestamp: {
    type: Date,
    default: Date.now
  },
  server: {
    hostname: String,
    pid: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ userEmail: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ risk: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });

// TTL index - keep logs for 1 year (also serves as timestamp index)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual fields
auditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static methods
auditLogSchema.statics.logAction = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to save audit log:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

auditLogSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.startDate) {
    query.where('timestamp').gte(options.startDate);
  }
  
  if (options.endDate) {
    query.where('timestamp').lte(options.endDate);
  }
  
  if (options.action) {
    query.where('action').equals(options.action);
  }
  
  if (options.resource) {
    query.where('resource').equals(options.resource);
  }
  
  return query.sort({ timestamp: -1 }).limit(options.limit || 100);
};

auditLogSchema.statics.findByRisk = function(riskLevel, options = {}) {
  const query = this.find({ risk: riskLevel });
  
  if (options.startDate) {
    query.where('timestamp').gte(options.startDate);
  }
  
  if (options.endDate) {
    query.where('timestamp').lte(options.endDate);
  }
  
  return query.sort({ timestamp: -1 }).limit(options.limit || 100);
};

auditLogSchema.statics.getSecurityEvents = function(options = {}) {
  const securityActions = [
    'access_denied', 'security_violation', 'login', 'logout',
    'reset_password', 'change_role', 'ban', 'unban'
  ];
  
  const query = this.find({ 
    action: { $in: securityActions },
    risk: { $in: ['medium', 'high', 'critical'] }
  });
  
  if (options.startDate) {
    query.where('timestamp').gte(options.startDate);
  }
  
  if (options.endDate) {
    query.where('timestamp').lte(options.endDate);
  }
  
  return query.sort({ timestamp: -1 }).limit(options.limit || 100);
};

auditLogSchema.statics.getActivitySummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

auditLogSchema.statics.getRiskMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$risk',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueIPs: { $addToSet: '$ip' }
      }
    },
    {
      $project: {
        risk: '$_id',
        count: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueIPCount: { $size: '$uniqueIPs' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Instance methods
auditLogSchema.methods.calculateRisk = function() {
  const riskFactors = [];
  
  // High-risk actions
  const highRiskActions = ['delete', 'ban', 'security_violation', 'system_change'];
  if (highRiskActions.includes(this.action)) {
    riskFactors.push('high');
  }
  
  // Critical resources
  const criticalResources = ['users', 'settings', 'system', 'security'];
  if (criticalResources.includes(this.resource)) {
    riskFactors.push('high');
  }
  
  // Failed actions
  if (!this.success) {
    riskFactors.push('medium');
  }
  
  // Admin role actions
  if (['admin', 'super_admin'].includes(this.userRole)) {
    riskFactors.push('medium');
  }
  
  // Determine final risk level
  if (riskFactors.includes('high')) {
    this.risk = 'critical';
  } else if (riskFactors.length >= 2) {
    this.risk = 'high';
  } else if (riskFactors.length === 1) {
    this.risk = 'medium';
  } else {
    this.risk = 'low';
  }
};

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  if (this.isNew) {
    this.calculateRisk();
    
    // Set server information
    this.server = {
      hostname: require('os').hostname(),
      pid: process.pid
    };
  }
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
