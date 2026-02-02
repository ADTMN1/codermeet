const express = require('express');
const router = express.Router();
const dailyChallengeController = require('../controllers/dailyChallengeController');
const auth = require('../middlewares/auth');
const { adminRateLimiter } = require('../middlewares/rateLimiter');

// Apply rate limiting to all routes
router.use(adminRateLimiter);

// Public routes
router.get('/leaderboard', dailyChallengeController.getDailyLeaderboard);
router.get('/today', dailyChallengeController.getTodayChallenge); // Make public for testing

// Authenticated routes
router.post('/submit', auth, dailyChallengeController.submitSolution);
router.get('/stats', auth, dailyChallengeController.getUserDailyStats);

// Admin routes (to be added later)
// router.post('/create', adminAuth, dailyChallengeController.createChallenge);
// router.put('/:id', adminAuth, dailyChallengeController.updateChallenge);

module.exports = router;
