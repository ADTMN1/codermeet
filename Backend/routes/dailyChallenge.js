const express = require('express');
const router = express.Router();
const dailyChallengeController = require('../controllers/dailyChallengeController');
const { authenticate, requirePermission, requireAdminWith2FA, logAdminAction } = require('../middlewares/roleBasedAuth');
const { adminRateLimiter } = require('../middlewares/rateLimiter');
const AuditService = require('../services/auditService');

// Apply rate limiting to all routes
router.use(adminRateLimiter);

// Public routes
router.get('/leaderboard', dailyChallengeController.getDailyLeaderboard);
router.get('/today', dailyChallengeController.getTodayChallenge);

// Authenticated routes
router.post('/submit', authenticate, dailyChallengeController.submitSolution);
router.get('/user-stats', authenticate, dailyChallengeController.getUserDailyStats);

// Admin routes with enhanced security and logging
router.get('/admin-stats', 
  authenticate, 
  requirePermission('daily_challenges', 'read'),
  logAdminAction('view_daily_challenge_stats'),
  dailyChallengeController.getDailyChallengeStats
);

router.post('/create', 
  authenticate, 
  requirePermission('daily_challenges', 'create'),
  logAdminAction('create_daily_challenge'),
  dailyChallengeController.createChallenge
);

router.get('/all', 
  authenticate, 
  requirePermission('daily_challenges', 'read'),
  logAdminAction('view_daily_challenges'),
  dailyChallengeController.getAllChallenges
);

router.put('/:id', 
  authenticate, 
  requirePermission('daily_challenges', 'update'),
  logAdminAction('update_daily_challenge'),
  dailyChallengeController.updateChallenge
);

router.delete('/:id', 
  authenticate, 
  requirePermission('daily_challenges', 'delete'),
  logAdminAction('delete_daily_challenge'),
  dailyChallengeController.deleteChallenge
);

module.exports = router;
