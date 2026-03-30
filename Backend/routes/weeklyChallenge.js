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
router.get('/:id/leaderboard', authenticate, weeklyChallengeController.getWeeklyChallengeLeaderboard);
router.put('/:id/submissions/:submissionId/review', authenticate, requireAdmin, weeklyChallengeController.reviewWeeklySubmission);
router.put('/:id/announce-winners', authenticate, requireAdmin, weeklyChallengeController.announceWinners);

// Public routes - require user authentication only
router.get('/', authenticate, weeklyChallengeController.getAllWeeklyChallenges);
router.get('/:id', authenticate, weeklyChallengeController.getWeeklyChallengeById);
router.get('/:id/stats', weeklyChallengeController.getWeeklyChallengeByIdStats);
router.post('/:id/join', authenticate, weeklyChallengeController.joinWeeklyChallenge);
router.post('/:id/submit', authenticate, weeklyChallengeController.submitWeeklyChallenge);
router.get('/:id/my-submission', authenticate, weeklyChallengeController.getUserSubmission);

// Test endpoint for simulating live stats updates
router.get('/:id/simulate-update', (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');
  
  if (io) {
    // Simulate a participant joining
    io.emit('participant-joined', {
      challengeId: id,
      count: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date()
    });
    
    // Simulate a submission
    setTimeout(() => {
      io.emit('submission-created', {
        challengeId: id,
        count: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date()
      });
    }, 2000);
    
    // Simulate online users change
    setTimeout(() => {
      io.emit('online-users', {
        count: Math.floor(Math.random() * 20) + 1
      });
    }, 4000);
  }
  
  res.json({ success: true, message: 'Live stats simulation triggered' });
});

module.exports = router;
