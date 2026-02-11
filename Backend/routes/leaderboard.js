const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Challenge = require('../models/challenge');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');

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

// @route   GET api/leaderboard
// @desc    Get leaderboard data with real stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get limit from query parameter, default to 10
    const limit = parseInt(req.query.limit) || 10;
    
    // Fetch users and sort by points
    const users = await User.find({})
      .select('username fullName points avatar plan role lastPointsUpdate createdAt activity')
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

      // For projects, we'll use challenge participations as a proxy
      // In a real implementation, you might have a separate Project model
      const projectsSubmitted = await Challenge.countDocuments({
        'participants.user': user._id
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
        profileImage: user.avatar,
        challengesCompleted,
        projectsSubmitted,
        streak,
        joinDate: user.createdAt,
        lastActive: user.activity?.lastActive || null,
        communityScore: await calculateCommunityScore(user._id, challengesCompleted, projectsSubmitted)
      };
    }));

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

    res.json({
      users: usersWithStats,
      totalUsers: stats.totalUsers,
      activeUsers: activeUsers,
      totalPoints: stats.totalPoints,
      averagePoints: Math.floor(stats.avgPoints),
      topScore: finalTopScore, // Use real calculated top score
      updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
