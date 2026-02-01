const express = require('express');
const router = express.Router();
const User = require('../models/user');

// @route   GET api/leaderboard
// @desc    Get leaderboard data
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get limit from query parameter, default to 10
    const limit = parseInt(req.query.limit) || 10;
    
    // Fetch users and sort by points
    const users = await User.find({})
      .select('username fullName points avatar plan role lastPointsUpdate')
      .sort({ points: -1 })
      .limit(limit);

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1,
      profileImage: user.avatar // Add profileImage field for compatibility
    }));

    res.json(usersWithRank);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
