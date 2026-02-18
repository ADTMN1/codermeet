const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Challenge = require('../models/challenge');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');
const Project = require('../models/project');
const { getUserBadges } = require('../services/badgeService');
const { validateLeaderboardData, sanitizeLeaderboardParams } = require('../middleware/validation');

// Calculate real community score based on user activity and contributions
async function calculateCommunityScore(userId, challengesCompleted, projectsSubmitted) {
  try {
    // Get user activity data
    const user = await User.findById(userId).select('activity createdAt');
    
    // Base score from challenges and projects
    let score = (challengesCompleted * 2) + (projectsSubmitted * 3);
    
    // Bonus for account age (older accounts get slight bonus)
    const daysSinceCreation = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    const ageBonus = Math.min(daysSinceCreation / 30, 5); // Max 5 points for age
    score += ageBonus;
    
    // Bonus for recent activity
    if (user.activity?.lastActive) {
      const daysSinceActive = Math.floor((Date.now() - user.activity.lastActive) / (1000 * 60 * 60 * 24));
      if (daysSinceActive <= 7) score += 2; // Active in last week
      else if (daysSinceActive <= 30) score += 1; // Active in last month
    }
    
    // Normalize to 0-10 scale
    const normalizedScore = Math.min(score / 10, 10);
    return normalizedScore.toFixed(1);
  } catch (error) {
    console.error('Error calculating community score:', error);
    return '5.0'; // Default score on error
  }
}

// Store previous ranks for comparison
async function storePreviousRanks(users) {
  try {
    // Store current ranks in a temporary collection or cache
    // For now, we'll use a simple approach with user model
    const rankUpdates = users.map((user, index) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { 
          $set: { 
            previousRank: user.previousRank || user.rank || index + 1,
            lastRankUpdate: new Date()
          }
        }
      }
    }));
    
    if (rankUpdates.length > 0) {
      await User.bulkWrite(rankUpdates);
    }
  } catch (error) {
    console.error('Error storing previous ranks:', error);
  }
}

// @route   GET api/leaderboard
// @desc    Get leaderboard data with real stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Sanitize input parameters
    const paramValidation = sanitizeLeaderboardParams(req.query);
    if (!paramValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid parameters', 
        errors: paramValidation.errors 
      });
    }
    
    const { limit = 10 } = paramValidation.sanitized;
    
    // Fetch users and sort by points
    const users = await User.find({})
      .select('username fullName points avatar plan role lastPointsUpdate createdAt activity previousRank')
      .sort({ points: -1 })
      .limit(limit);

    // Get total user count for stats
    const totalUsers = await User.countDocuments();

    // Get real stats for each user
    const usersWithStats = await Promise.all(users.map(async (user, index) => {
      // Count challenge submissions (accepted ones)
      const challengeSubmissions = await Challenge.countDocuments({
        'submissions.userId': user._id,
        'submissions.status': 'accepted'
      });

      // Count daily challenge wins
      const dailyChallengeWins = await DailyChallenge.countDocuments({
        'winners.userId': user._id
      });

      // Calculate total challenges completed
      const challengesCompleted = challengeSubmissions + dailyChallengeWins;

      // Count real projects submitted
      const projectsSubmitted = await Project.countDocuments({
        userId: user._id,
        status: { $in: ['completed', 'published'] }
      });

      // Calculate real streak based on consecutive daily submissions
      const streakData = await DailySubmission.aggregate([
        {
          $match: { userId: user._id, status: { $in: ['passed', 'submitted'] } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);
      
      // Calculate consecutive days
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      
      for (let i = 0; i < streakData.length; i++) {
        const submissionDate = new Date(streakData[i]._id);
        submissionDate.setHours(0, 0, 0, 0); // Set to start of day
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0); // Set to start of day
        
        if (submissionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
      
      // Alternative streak calculation based on any activity
      if (streak === 0 && user.activity?.lastActive) {
        const daysSinceActive = Math.floor((Date.now() - user.activity.lastActive) / (1000 * 60 * 60 * 24));
        if (daysSinceActive <= 1) {
          streak = 1; // Give at least 1 day streak if recently active
        }
      }

      return {
        ...user.toObject(),
        rank: index + 1,
        previousRank: user.previousRank || null,
        profileImage: user.avatar,
        challengesCompleted,
        projectsSubmitted,
        streak,
        joinDate: user.createdAt,
        lastActive: user.activity?.lastActive || null,
        communityScore: await calculateCommunityScore(user._id, challengesCompleted, projectsSubmitted),
        badges: await getUserBadges(user._id)
      };
    }));

    // Store current ranks for next comparison
    await storePreviousRanks(usersWithStats);

    // Calculate real stats from all users
    const allUsersStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          avgPoints: { $avg: '$points' },
          maxPoints: { $max: '$points' }
        }
      }
    ]);

    const stats = allUsersStats[0] || {
      totalUsers: 0,
      totalPoints: 0,
      avgPoints: 0,
      maxPoints: 0
    };

    // Calculate real top score from actual user activity (not fake points)
    const realTopScoreCalculation = await User.aggregate([
      {
        $match: { points: { $gt: 0 } } // Only users with actual points
      },
      {
        $group: {
          _id: null,
          maxPoints: { $max: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const realTopScore = realTopScoreCalculation[0]?.maxPoints || 0;
    const usersWithPoints = realTopScoreCalculation[0]?.count || 0;
    
    // Fallback: calculate from challenge completions if no one has points
    let finalTopScore = realTopScore;
    if (finalTopScore === 0) {
      // Calculate top score based on most challenges completed
      const topChallenges = await Promise.all(users.map(async (user) => {
        const challengeCount = await Challenge.countDocuments({
          'submissions.userId': user._id,
          'submissions.status': 'accepted'
        });
        return { userId: user._id, challengeCount };
      }));
      
      const maxChallenges = Math.max(...topChallenges.map(u => u.challengeCount), 0);
      finalTopScore = maxChallenges * 50; // 50 points per challenge average
    }

    // Count active users (users active in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      'activity.lastActive': { $gte: thirtyDaysAgo }
    });

    // Prepare response data
    const responseData = {
      users: usersWithStats,
      totalUsers: stats.totalUsers,
      activeUsers: activeUsers,
      totalPoints: stats.totalPoints,
      averagePoints: Math.floor(stats.avgPoints),
      topScore: finalTopScore,
      updated: new Date().toISOString()
    };

    // Validate final data before sending
    const dataValidation = validateLeaderboardData(responseData);
    if (!dataValidation.isValid) {
      console.error('Leaderboard data validation failed:', dataValidation.errors);
      // Still send data but log errors for debugging
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/leaderboard/user-rank
// @desc    Get current user's rank
// @access  Private
router.get('/user-rank', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Get user from token (you might need to adjust this based on your auth middleware)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('points');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate user's rank
    const usersWithMorePoints = await User.countDocuments({ points: { $gt: user.points || 0 } });
    const rank = usersWithMorePoints + 1;

    res.json({
      success: true,
      rank: rank
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET api/leaderboard/top/challenges
// @desc    Get top users by challenges completed
// @access  Private
router.get('/top/challenges', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // Get users and count their challenges manually
    const users = await User.find({})
      .select('username fullName avatar')
      .limit(50);

    const usersWithChallenges = await Promise.all(users.map(async (user) => {
      // Count challenge submissions
      const challengeSubmissions = await Challenge.countDocuments({
        'submissions.userId': user._id,
        'submissions.status': 'accepted'
      });

      // Count daily challenge wins
      const dailyChallengeWins = await DailyChallenge.countDocuments({
        'winners.userId': user._id
      });

      const challengesCompleted = challengeSubmissions + dailyChallengeWins;

      return {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        score: challengesCompleted
      };
    }));

    // Sort by challenges completed and take top
    const topUsers = usersWithChallenges
      .filter(u => u.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      users: topUsers
    });
  } catch (error) {
    console.error('Error fetching top challenge users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/leaderboard/top/community
// @desc    Get top users by community score
// @access  Private
router.get('/top/community', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // Get all users and calculate community scores
    const users = await User.find({})
      .select('username fullName avatar plan role createdAt activity')
      .limit(50); // Limit for performance

    const usersWithScores = await Promise.all(users.map(async (user) => {
      // Count challenge submissions
      const challengeSubmissions = await Challenge.countDocuments({
        'submissions.userId': user._id,
        'submissions.status': 'accepted'
      });

      // Count real project participations
      const projectsSubmitted = await Project.countDocuments({
        userId: user._id,
        status: { $in: ['completed', 'published'] }
      });

      const communityScore = await calculateCommunityScore(user._id, challengeSubmissions, projectsSubmitted);

      return {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        score: parseFloat(communityScore)
      };
    }));

    // Sort by community score and take top
    const topUsers = usersWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      users: topUsers
    });
  } catch (error) {
    console.error('Error fetching top community users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/leaderboard/top/projects
// @desc    Get top users by projects submitted
// @access  Private
router.get('/top/projects', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // Get users and count their real projects
    const users = await User.find({})
      .select('username fullName avatar')
      .limit(50);

    const usersWithProjects = await Promise.all(users.map(async (user) => {
      // Count real projects
      const projectsSubmitted = await Project.countDocuments({
        userId: user._id,
        status: { $in: ['completed', 'published'] }
      });

      return {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        score: projectsSubmitted
      };
    }));

    // Sort by projects submitted and take top
    const topUsers = usersWithProjects
      .filter(u => u.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      users: topUsers
    });
  } catch (error) {
    console.error('Error fetching top project users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/leaderboard/top/streaks
// @desc    Get top users by activity streaks
// @access  Private
router.get('/top/streaks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    // Get users and calculate their streaks
    const users = await User.find({})
      .select('username fullName avatar activity')
      .limit(50); // Limit for performance

    const usersWithStreaks = await Promise.all(users.map(async (user) => {
      // Calculate streak based on daily submissions
      const streakData = await DailySubmission.aggregate([
        {
          $match: { userId: user._id, status: { $in: ['passed', 'submitted'] } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);
      
      // Calculate consecutive days
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < streakData.length; i++) {
        const submissionDate = new Date(streakData[i]._id);
        submissionDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (submissionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
      
      // Alternative streak calculation
      if (streak === 0 && user.activity?.lastActive) {
        const daysSinceActive = Math.floor((Date.now() - user.activity.lastActive) / (1000 * 60 * 60 * 24));
        if (daysSinceActive <= 1) {
          streak = 1;
        }
      }

      return {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        score: streak
      };
    }));

    // Sort by streak and take top
    const topUsers = usersWithStreaks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      users: topUsers
    });
  } catch (error) {
    console.error('Error fetching top streak users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
