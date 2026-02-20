// routes/challenges.js
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const messageController = require('../controllers/messageController');
const { authenticate, requirePermission } = require('../middlewares/roleBasedAuth');
const { adminRateLimiter } = require('../middlewares/rateLimiter');

// Apply rate limiting to all routes
router.use(adminRateLimiter);

// Public routes (no admin auth required)
router.get('/', challengeController.getAllChallenges); // Get all challenges (public)

// Admin-only routes (require admin auth)
router.get('/admin', authenticate, requirePermission('content', 'read'), challengeController.getAllChallenges); // Admin challenge management
router.get('/admin/challenges/all', authenticate, requirePermission('content', 'read'), challengeController.getAllChallenges); // Admin get all challenges endpoint
router.post('/', authenticate, requirePermission('content', 'create'), challengeController.createChallenge);
router.get('/stats', authenticate, requirePermission('content', 'read'), challengeController.getChallengeStats); // Admin stats endpoint
router.get('/:id', challengeController.getChallengeById); // Get specific challenge
router.put('/:id', authenticate, requirePermission('content', 'update'), challengeController.updateChallenge);
router.delete('/:id', authenticate, requirePermission('content', 'delete'), challengeController.deleteChallenge);

// Public stats endpoint (no auth required) - moved after specific routes
router.get('/:id/stats', challengeController.getChallengeByIdStats);

// User registration routes (require auth)
router.post('/:id/register', authenticate, challengeController.registerForChallenge);
router.post('/:id/unregister', authenticate, challengeController.unregisterFromChallenge);
router.get('/:id/check-registration', authenticate, challengeController.checkRegistration);
router.post('/:id/submit', authenticate, challengeController.submitProject);
router.get('/:id/my-submission', authenticate, challengeController.getUserSubmission);

// Admin-only submission management
router.get('/:id/submissions', authenticate, requirePermission('content', 'read'), challengeController.getChallengeSubmissions);
router.get('/submissions/all', authenticate, requirePermission('content', 'read'), challengeController.getAllSubmissions);
router.put('/:challengeId/submissions/:submissionId/review', authenticate, requirePermission('content', 'update'), challengeController.reviewSubmission);

// Admin-only winner selection
router.post('/:id/select-winners', authenticate, requirePermission('content', 'manage'), challengeController.selectWinners);

// Challenge discussion routes
router.get('/:id/messages', authenticate, messageController.getMessages);
router.post('/:id/messages', authenticate, messageController.createMessage);

module.exports = router;
