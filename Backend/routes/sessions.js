// routes/sessions.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');
const User = require('../models/user');
const AuditService = require('../services/auditService');

// Get current user's active sessions
router.get('/my-sessions', authenticate, async (req, res) => {
  try {
    const user = req.userProfile;
    
    const activeSessions = user.activity.sessions.filter(session => session.isActive);
    
    res.json({
      success: true,
      data: {
        sessions: activeSessions,
        totalSessions: user.activity.sessions.length,
        currentSessionId: req.sessionId
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions'
    });
  }
});

// Terminate a specific session
router.delete('/terminate/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.userProfile;
    
    // Don't allow terminating current session
    if (sessionId === req.sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot terminate current session'
      });
    }
    
    await user.terminateSession(sessionId);
    
    await AuditService.logAction(req, res, 'terminate_session', 'security', {
      terminatedSessionId: sessionId
    });
    
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate session'
    });
  }
});

// Terminate all other sessions (except current)
router.delete('/terminate-all-others', authenticate, async (req, res) => {
  try {
    const user = req.userProfile;
    
    // Get all sessions except current
    const otherSessions = user.activity.sessions.filter(
      session => session.isActive && session.sessionId !== req.sessionId
    );
    
    // Terminate all other sessions
    for (const session of otherSessions) {
      await user.terminateSession(session.sessionId);
    }
    
    await AuditService.logAction(req, res, 'terminate_all_sessions', 'security', {
      terminatedCount: otherSessions.length
    });
    
    res.json({
      success: true,
      message: `Terminated ${otherSessions.length} other sessions successfully`,
      terminatedCount: otherSessions.length
    });
  } catch (error) {
    console.error('Terminate all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate sessions'
    });
  }
});

// Get session activity history
router.get('/activity-history', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUserId = userId || req.userProfile._id;
    
    // Only allow admins to view other users' session history
    if (userId && userId !== req.userProfile._id.toString() && !['admin', 'super_admin'].includes(req.userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view other users\' session history'
      });
    }
    
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const loginHistory = user.adminProfile.loginHistory || [];
    
    res.json({
      success: true,
      data: {
        loginHistory: loginHistory.sort((a, b) => b.timestamp - a.timestamp),
        totalLogins: user.activity.totalLogins,
        lastActive: user.activity.lastActive
      }
    });
  } catch (error) {
    console.error('Get activity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity history'
    });
  }
});

// Update session timeout settings (admin only)
router.put('/session-timeout', authenticate, requireAdmin, async (req, res) => {
  try {
    const { timeoutMinutes } = req.body;
    
    if (!timeoutMinutes || timeoutMinutes < 5 || timeoutMinutes > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Session timeout must be between 5 minutes and 24 hours'
      });
    }
    
    const user = req.userProfile;
    const oldTimeout = user.adminProfile.sessionTimeout;
    user.adminProfile.sessionTimeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    
    await user.save();
    
    await AuditService.logAction(req, res, 'update_session_timeout', 'security', {
      before: { timeoutMinutes: oldTimeout / 60000 },
      after: { timeoutMinutes }
    });
    
    res.json({
      success: true,
      message: 'Session timeout updated successfully',
      data: {
        timeoutMinutes
      }
    });
  } catch (error) {
    console.error('Update session timeout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session timeout'
    });
  }
});

// Get security metrics (admin only)
router.get('/security-metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      securityEvents,
      failedLogins
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'activity.lastActive': { $gte: startDate } }),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      AuditService.getSecurityEvents({ startDate }),
      AuditService.getFailedLogins({ startDate })
    ]);
    
    res.json({
      success: true,
      data: {
        period: { days: parseInt(days), startDate },
        totalUsers,
        activeUsers,
        adminUsers,
        securityEvents: securityEvents.length,
        failedLogins: failedLogins.length
      }
    });
  } catch (error) {
    console.error('Get security metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security metrics'
    });
  }
});

// Force logout user (admin only)
router.post('/force-logout/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Terminate all sessions for the user
    await user.terminateAllSessions();
    
    await AuditService.logAction(req, res, 'force_logout', 'security', {
      targetUserId: userId,
      targetUserEmail: user.email
    });
    
    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout user'
    });
  }
});

module.exports = router;
