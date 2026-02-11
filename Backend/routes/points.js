const express = require('express');
const router = express.Router();
const pointsService = require('../services/pointsService');

// Award points for challenge submission
router.post('/challenge', pointsService.awardChallengePoints);

// Award points for daily challenge completion
router.post('/daily', pointsService.awardDailyChallengePoints);

// Get user's points history
router.get('/history/:userId', pointsService.getPointsHistory);

module.exports = router;
