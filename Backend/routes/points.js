const express = require('express');
const router = express.Router();
const pointsService = require('../services/pointsService');

// Award points for challenge submission
router.post('/challenge', async (req, res) => {
  const result = await pointsService.awardChallengePoints(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// Award points for daily challenge completion
router.post('/daily', async (req, res) => {
  const result = await pointsService.awardDailyChallengePoints(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// Get user's points history
router.get('/history/:userId', async (req, res) => {
  const result = await pointsService.getPointsHistory({
    userId: req.params.userId,
    limit: req.query.limit,
    page: req.query.page
  });
  res.status(result.success ? 200 : 404).json(result);
});

module.exports = router;
