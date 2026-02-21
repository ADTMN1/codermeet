// Admin Challenge Generation Routes
const express = require('express');
const router = express.Router();
const adminChallengeController = require('../controllers/adminChallengeController');
const challengeController = require('../controllers/challengeController');
const auth = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roleBasedAuth');

// All routes require admin authentication
router.use(auth);
router.use(requireAdmin);

// Generate single challenge (preview only)
router.post('/generate', adminChallengeController.generateChallenge);

// Generate and create challenge immediately
router.post('/generate-and-create', adminChallengeController.generateAndCreateChallenge);

// Generate weekly challenges
router.post('/generate-weekly', adminChallengeController.generateWeeklyChallenges);

// Auto-generate challenges for next N days
router.post('/auto-generate', adminChallengeController.autoGenerateChallenges);

// Generate topic-specific challenge
router.post('/generate-topic', adminChallengeController.generateTopicChallenge);

// Get available dates for scheduling
router.get('/available-dates', adminChallengeController.getAvailableDates);

// Get weekly schedule with advanced features
router.get('/weekly-schedule', adminChallengeController.getWeeklySchedule);

// Get monthly schedule with calendar view
router.get('/monthly-schedule', adminChallengeController.getMonthlySchedule);

// Bulk register challenges with preferences
router.post('/bulk-register', adminChallengeController.bulkRegisterChallenges);

// Bulk preview challenges (generate without saving)
router.post('/bulk-preview', adminChallengeController.bulkPreviewChallenges);

// Bulk preview challenges with real-time streaming
router.post('/bulk-preview-stream', adminChallengeController.bulkPreviewChallengesStream);

// Get generation statistics
router.get('/stats', challengeController.getChallengeStats);

// Get all challenges for admin
router.get('/all', challengeController.getAllChallenges); // Main challenges only

// Get challenge by ID for admin
router.get('/:id', challengeController.getChallengeById);

// Update challenge by ID for admin
router.put('/:id', challengeController.updateChallenge);

// Get challenge submissions for admin
router.get('/:id/submissions', challengeController.getChallengeSubmissions);

// Get daily challenges for admin  
router.get('/daily', adminChallengeController.getAllChallenges); // Daily challenges only

// Bulk generate for date range
router.post('/bulk-generate', adminChallengeController.bulkGenerate);

module.exports = router;
