const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const {
  getUpcomingSession,
  getUserSessions,
  getAvailableMentors,
  bookSession,
  cancelSession,
  joinSession,
  rateSession,
  getMentorshipStats
} = require('../controllers/mentorshipController');

// Get upcoming mentorship session
router.get('/upcoming', authMiddleware, getUpcomingSession);

// Get all user's mentorship sessions with pagination and filtering
router.get('/sessions', authMiddleware, getUserSessions);

// Get available mentors for booking with filtering
router.get('/mentors', authMiddleware, getAvailableMentors);

// Get mentorship statistics
router.get('/stats', authMiddleware, getMentorshipStats);

// Book a new mentorship session
router.post('/book', authMiddleware, bookSession);

// Cancel a session
router.post('/sessions/:sessionId/cancel', authMiddleware, cancelSession);

// Join a session (get meeting link)
router.post('/sessions/:sessionId/join', authMiddleware, joinSession);

// Rate a completed session
router.post('/sessions/:sessionId/rate', authMiddleware, rateSession);

module.exports = router;
