const express = require('express');
const router = express.Router();
const User = require('../models/user');

// @route   GET api/leaderboard
// @desc    Get leaderboard data
// @access  Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find({})
      .select('name points profileImage') // Only get necessary fields
      .sort({ points: -1 }) // Sort by points descending
      .limit(10); // Get top 10

    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
