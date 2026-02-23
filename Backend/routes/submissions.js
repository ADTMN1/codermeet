const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/submissionController');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');
const { adminRateLimiter } = require('../middlewares/rateLimiter');
const { body, param, query, validationResult } = require('express-validator');

// Apply authentication to all routes
router.use(authenticate);

/**
 * Professional Submission Routes
 * Enterprise-grade API endpoints for submission management
 * Follows RESTful conventions and security best practices
 */

// Validation middleware
const validateSubmission = [
  body('challengeId').isMongoId().withMessage('Invalid challenge ID'),
  body('challengeType').isIn(['weekly', 'daily', 'business', 'mentorship', 'hackathon', 'competition']).withMessage('Invalid challenge type'),
  body('content').isObject().withMessage('Content must be an object'),
  body('content.githubUrl').optional().isURL().withMessage('Invalid GitHub URL'),
  body('content.liveUrl').optional().isURL().withMessage('Invalid live URL'),
  body('content.code').optional().isString().withMessage('Code must be a string'),
  body('content.language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'ruby', 'php', 'go', 'rust', 'typescript', 'other']).withMessage('Invalid programming language'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateReview = [
  param('submissionId').isMongoId().withMessage('Invalid submission ID'),
  body('status').isIn(['approved', 'accepted', 'rejected', 'reviewed']).withMessage('Invalid review status'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('feedback').optional().isString().isLength({ max: 2000 }).withMessage('Feedback must be less than 2000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['submittedAt', 'score', 'status', 'challengeType']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * @route   POST /api/submissions
 * @desc    Create a new submission
 * @access  Private
 */
router.post('/', authenticate, validateSubmission, SubmissionController.createSubmission);

/**
 * @route   GET /api/submissions
 * @desc    Get all submissions with filtering and pagination
 * @access  Private (Admin can see all, users see only their own)
 */
router.get('/', authenticate, validatePagination, SubmissionController.getAllSubmissions);

/**
 * @route   GET /api/submissions/stats
 * @desc    Get submission statistics
 * @access  Private
 */
router.get('/stats', authenticate, SubmissionController.getSubmissionStats);

/**
 * @route   GET /api/submissions/analytics
 * @desc    Get submission analytics and trends
 * @access  Private (Admin only)
 */
router.get('/analytics', authenticate, requireAdmin, SubmissionController.getSubmissionAnalytics);

/**
 * @route   GET /api/submissions/export
 * @desc    Export submissions as CSV
 * @access  Private (Admin only)
 */
router.get('/export', authenticate, requireAdmin, SubmissionController.exportSubmissions);

/**
 * @route   POST /api/submissions/bulk-review
 * @desc    Bulk review multiple submissions
 * @access  Private (Admin only)
 */
router.post('/bulk-review', authenticate, requireAdmin, adminRateLimiter, SubmissionController.bulkReviewSubmissions);

/**
 * @route   GET /api/submissions/:submissionId
 * @desc    Get submission by ID
 * @access  Private
 */
router.get('/:submissionId', authenticate, param('submissionId').isMongoId(), SubmissionController.getSubmissionById);

/**
 * @route   PUT /api/submissions/:submissionId/review
 * @desc    Review a submission
 * @access  Private (Admin only)
 */
router.put('/:submissionId/review', authenticate, requireAdmin, adminRateLimiter, validateReview, SubmissionController.reviewSubmission);

/**
 * @route   POST /api/submissions/:submissionId/archive
 * @desc    Archive a submission
 * @access  Private (Admin only)
 */
router.post('/:submissionId/archive', authenticate, requireAdmin, param('submissionId').isMongoId(), SubmissionController.archiveSubmission);

/**
 * @route   GET /api/submissions/challenge/:challengeId
 * @desc    Get submissions for a specific challenge
 * @access  Private
 */
router.get('/challenge/:challengeId', authenticate, param('challengeId').isMongoId(), SubmissionController.getChallengeSubmissions);

/**
 * @route   GET /api/submissions/user/:userId
 * @desc    Get submissions by user
 * @access  Private (Admin can see all, users see only their own)
 */
router.get('/user/:userId', authenticate, param('userId').isMongoId(), (req, res, next) => {
  // Users can only see their own submissions unless they're admin
  if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  next();
}, SubmissionController.getUserSubmissions);

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('Submission route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = router;
