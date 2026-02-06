const express = require('express');
const router = express.Router();
const {
  submitBusinessIdea,
  getUserBusinessIdeas,
  getAllBusinessIdeas,
  updateIdeaStatus,
  getIdeaStats
} = require('../controllers/businessIdeaController');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');

// Public routes (authenticated users)
router.post('/', authenticate, submitBusinessIdea);
router.get('/user/:userId', authenticate, getUserBusinessIdeas);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllBusinessIdeas);
router.get('/stats', authenticate, requireAdmin, getIdeaStats);
router.patch('/:id', authenticate, requireAdmin, updateIdeaStatus);

module.exports = router;
