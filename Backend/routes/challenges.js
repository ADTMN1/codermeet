// routes/challenges.js
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const adminAuth = require('../middlewares/adminAuth');
const auth = require('../middlewares/auth');
const { adminRateLimiter } = require('../middlewares/rateLimiter');

// Apply rate limiting to all routes
router.use(adminRateLimiter);

// Public routes (no admin auth required)
router.get('/', challengeController.getAllChallenges); // Get all challenges (public)

// Public stats endpoint (no auth required)
router.get('/:id/stats', challengeController.getChallengeByIdStats);

// Admin-only routes (require admin auth)
router.post('/', adminAuth, challengeController.createChallenge);
router.get('/stats', adminAuth, challengeController.getChallengeStats); // Must come before /:id
router.get('/:id', challengeController.getChallengeById); // Get specific challenge
router.put('/:id', adminAuth, challengeController.updateChallenge);
router.delete('/:id', adminAuth, challengeController.deleteChallenge);

// User registration routes (require auth)
router.post('/:id/register', auth, challengeController.registerForChallenge);
router.post('/:id/unregister', auth, challengeController.unregisterFromChallenge);
router.get('/:id/check-registration', auth, challengeController.checkRegistration);
router.post('/:id/submit', auth, challengeController.submitProject);
router.get('/:id/my-submission', auth, challengeController.getUserSubmission);

// Admin-only submission management
router.get('/:id/submissions', adminAuth, challengeController.getChallengeSubmissions);
router.get('/submissions/all', adminAuth, challengeController.getAllSubmissions);
router.put('/:challengeId/submissions/:submissionId/review', adminAuth, challengeController.reviewSubmission);

// Admin-only winner selection
router.post('/:id/select-winners', adminAuth, challengeController.selectWinners);

module.exports = router;
