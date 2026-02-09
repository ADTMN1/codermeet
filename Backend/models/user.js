// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    primaryLanguage: { type: String, trim: true },
    skills: { type: [String], default: [] },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
    avatar: { type: String },           // Cloudinary secure_url
    avatarPublicId: { type: String },   // Cloudinary public_id (for delete)

    plan: {
      type: String,
      enum: ["Trial", "Basic", "Premium"],
      default: "Trial",
    },
    isProfessional: { type: Boolean, default: false },
    
    // Enhanced Role-Based Access Control
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator", "professional", "basic", "trial"],
      default: "trial",
    },
    
    // Granular permissions system
    permissions: [{
      resource: {
        type: String,
        enum: [
          "daily_challenges", "users", "analytics", "content", 
          "payments", "settings", "reports", "moderation"
        ]
      },
      actions: [{
        type: String,
        enum: ["create", "read", "update", "delete", "manage"]
      }]
    }],
    
    // Admin-specific profile
    adminProfile: {
      department: { type: String, trim: true },
      accessLevel: { 
        type: Number, 
        min: 1, 
        max: 10, 
        default: 1 
      },
      lastLoginIP: { type: String },
      loginHistory: [{
        timestamp: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String },
        location: { type: String }
      }],
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String },
      sessionTimeout: { 
        type: Number, 
        default: 3600000, // 1 hour in ms
        min: 300000 // 5 minutes minimum
      }
    },
    
    // Security and session management
    security: {
      lastPasswordChange: { type: Date, default: Date.now },
      failedLoginAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date },
      passwordResetToken: { type: String },
      passwordResetExpires: { type: Date },
      emailVerified: { type: Boolean, default: false },
      emailVerificationToken: { type: String },
      twoFactorBackupCodes: [String]
    },
    
    // Activity tracking
    activity: {
      lastActive: { type: Date, default: Date.now },
      totalLogins: { type: Number, default: 0 },
      currentSessionStart: { type: Date },
      sessions: [{
        sessionId: String,
        createdAt: { type: Date, default: Date.now },
        lastAccessed: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
        isActive: { type: Boolean, default: true }
      }]
    },
    
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    lastPointsUpdate: {
      type: Date,
      default: Date.now,
    },
    connections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    }],
  }, 
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive information when converting to JSON
        delete ret.password;
        delete ret.__v;
        
        // Safely delete nested properties
        if (ret.adminProfile && ret.adminProfile.twoFactorSecret) {
          delete ret.adminProfile.twoFactorSecret;
        }
        if (ret.security) {
          delete ret.security.passwordResetToken;
          delete ret.security.emailVerificationToken;
          delete ret.security.twoFactorBackupCodes;
        }
        
        return ret;
      }
    }
  }
);

// Indexes for performance (email and username already indexed via unique: true)
userSchema.index({ role: 1 });
userSchema.index({ "adminProfile.twoFactorEnabled": 1 });
userSchema.index({ "security.lockUntil": 1 });
userSchema.index({ "activity.lastActive": -1 });

// Role-based permission methods
userSchema.methods.hasPermission = function(resource, action) {
  if (this.role === 'admin') return true; // Admins have full access
  
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

userSchema.methods.addPermission = function(resource, action) {
  const existingPermission = this.permissions.find(p => p.resource === resource);
  if (existingPermission) {
    if (!existingPermission.actions.includes(action)) {
      existingPermission.actions.push(action);
    }
  } else {
    this.permissions.push({ resource, actions: [action] });
  }
  return this.save();
};

userSchema.methods.removePermission = function(resource, action) {
  const permissionIndex = this.permissions.findIndex(p => p.resource === resource);
  if (permissionIndex !== -1) {
    const permission = this.permissions[permissionIndex];
    permission.actions = permission.actions.filter(a => a !== action);
    if (permission.actions.length === 0) {
      this.permissions.splice(permissionIndex, 1);
    }
  }
  return this.save();
};

// Session management methods
userSchema.methods.createSession = function(sessionId, ip, userAgent) {
  this.activity.sessions.push({
    sessionId,
    ip,
    userAgent,
    createdAt: new Date(),
    lastAccessed: new Date()
  });
  this.activity.currentSessionStart = new Date();
  this.activity.totalLogins += 1;
  return this.save();
};

userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activity.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastAccessed = new Date();
    this.activity.lastActive = new Date();
  }
  return this.save();
};

userSchema.methods.terminateSession = function(sessionId) {
  const session = this.activity.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.isActive = false;
  }
  return this.save();
};

userSchema.methods.terminateAllSessions = function() {
  this.activity.sessions.forEach(session => {
    session.isActive = false;
  });
  return this.save();
};

// Security methods
userSchema.methods.incrementFailedLogin = function() {
  this.security.failedLoginAttempts += 1;
  if (this.security.failedLoginAttempts >= 5) {
    this.security.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
  return this.save();
};

userSchema.methods.resetFailedLogin = function() {
  this.security.failedLoginAttempts = 0;
  this.security.lockUntil = undefined;
  return this.save();
};

userSchema.methods.isLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Pre-save middleware (temporarily disabled)
// userSchema.pre('save', function(next) {
//   if (this.isModified('role') && this.role !== 'trial') {
//     // Set default permissions based on role
//     this.setDefaultPermissions();
//   }
//   next();
// });

userSchema.methods.setDefaultPermissions = function() {
  this.permissions = [];
  
  switch(this.role) {
    case 'admin':
      this.permissions = [
        { resource: 'daily_challenges', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'analytics', actions: ['read', 'manage'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'payments', actions: ['read', 'manage'] },
        { resource: 'settings', actions: ['read', 'update', 'manage'] },
        { resource: 'reports', actions: ['read', 'manage'] },
        { resource: 'moderation', actions: ['read', 'update', 'manage'] }
      ];
      this.plan = 'Premium';
      this.isProfessional = true;
      break;
      
    case 'moderator':
      this.permissions = [
        { resource: 'daily_challenges', actions: ['read'] },
        { resource: 'users', actions: ['read'] },
        { resource: 'content', actions: ['read', 'update'] },
        { resource: 'moderation', actions: ['read', 'update'] }
      ];
      break;
      
    case 'professional':
      this.plan = 'Premium';
      this.isProfessional = true;
      break;
  }
};

module.exports = mongoose.model("User", userSchema);
