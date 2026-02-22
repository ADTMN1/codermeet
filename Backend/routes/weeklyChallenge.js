const express = require('express');
const router = express.Router();
const weeklyChallengeController = require('../controllers/weeklyChallengeController');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');

// Admin routes - require authentication first, then admin role
router.get('/check-exists', authenticate, requireAdmin, weeklyChallengeController.checkWeeklyChallengeExists);
router.get('/next-available-week', authenticate, requireAdmin, weeklyChallengeController.getNextAvailableWeek);
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

// Debug route - temporary for troubleshooting (no auth for testing)
router.get('/:id/debug-status', weeklyChallengeController.debugChallengeStatus);

// Check participation route - temporary (no auth for testing)
router.get('/:id/check-participation', weeklyChallengeController.checkUserParticipation);

// Clear submission route - temporary (no auth for testing)
router.delete('/:id/clear-submission', weeklyChallengeController.clearSubmission);

// Test submission route - temporary (no auth for testing)
router.post('/:id/test-submit', weeklyChallengeController.submitWeeklyChallenge);

// Fix dates route - temporary (no auth for testing)
router.put('/:id/fix-dates', weeklyChallengeController.fixChallengeDates);

module.exports = router;
