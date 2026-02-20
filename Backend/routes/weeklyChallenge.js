const express = require('express');
const router = express.Router();
const weeklyChallengeController = require('../controllers/weeklyChallengeController');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');

// Admin routes - require authentication first, then admin role
router.post('/', authenticate, requireAdmin, weeklyChallengeController.createWeeklyChallenge);
router.get('/stats', authenticate, requireAdmin, weeklyChallengeController.getWeeklyChallengeStats);
router.put('/:id', authenticate, requireAdmin, weeklyChallengeController.updateWeeklyChallenge);
router.delete('/:id', authenticate, requireAdmin, weeklyChallengeController.deleteWeeklyChallenge);
router.get('/:id/submissions', authenticate, requireAdmin, weeklyChallengeController.getWeeklyChallengeSubmissions);
router.put('/:id/submissions/:submissionId/review', authenticate, requireAdmin, weeklyChallengeController.reviewWeeklySubmission);
router.put('/:id/announce-winners', authenticate, requireAdmin, weeklyChallengeController.announceWinners);

// Public routes - require user authentication only
router.get('/', authenticate, weeklyChallengeController.getAllWeeklyChallenges);
router.get('/:id', authenticate, weeklyChallengeController.getWeeklyChallengeById);
router.post('/:id/join', authenticate, weeklyChallengeController.joinWeeklyChallenge);
router.post('/:id/submit', authenticate, weeklyChallengeController.submitWeeklyChallenge);
router.get('/:id/my-submission', authenticate, weeklyChallengeController.getUserSubmission);

module.exports = router;
