const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Submission = require('../models/submission');

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

// @route   GET api/leaderboard/top/challenges
// @desc    Get top users by challenges completed
// @access  Public
router.get('/top/challenges', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // For now, get users with highest points as challenge masters
    // In a real implementation, you'd track actual challenge submissions
    const topChallengers = await User.find({})
      .select('username fullName avatar points')
      .sort({ points: -1 })
      .limit(limit);

    const result = topChallengers.map(user => ({
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      submissionsCount: user.points // Use points as proxy for challenges completed
    }));

    res.json({ users: result });
  } catch (error) {
    console.error('Error fetching top challengers:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});

// @route   GET api/leaderboard/top/community
// @desc    Get top users by community engagement
// @access  Public
router.get('/top/community', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // For now, get users with most connections as community heroes
    const topCommunityUsers = await User.find({})
      .select('username fullName avatar connections')
      .sort({ connections: -1 })
      .limit(limit);

    const result = topCommunityUsers.map(user => ({
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      connectionsCount: user.connections?.length || 0
    }));

    res.json({ users: result });
  } catch (error) {
    console.error('Error fetching top community users:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});

// @route   GET api/leaderboard/top/projects
// @desc    Get top users by projects submitted
// @access  Public
router.get('/top/projects', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // For now, get users with highest points as project builders
    // In a real implementation, you'd track actual project submissions
    const topProjectUsers = await User.find({})
      .select('username fullName avatar points')
      .sort({ points: -1 })
      .limit(limit);

    const result = topProjectUsers.map(user => ({
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      projectsCount: user.points // Use points as proxy for projects submitted
    }));

    res.json({ users: result });
  } catch (error) {
    console.error('Error fetching top project users:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});

// @route   GET api/leaderboard/top/streaks
// @desc    Get top users by login streaks
// @access  Public
router.get('/top/streaks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // For now, get users with highest points as streak champions
    // In a real implementation, you'd track actual login streaks
    const topStreakUsers = await User.find({})
      .select('username fullName avatar points lastActive')
      .sort({ points: -1 })
      .limit(limit);

    const result = topStreakUsers.map(user => ({
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      streakScore: user.points,
      lastActive: user.lastActive
    }));

    res.json({ users: result });
  } catch (error) {
    console.error('Error fetching top streak users:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
});

module.exports = router;

module.exports = router;
