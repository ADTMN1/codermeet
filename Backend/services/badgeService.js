const User = require('../models/user');
const Challenge = require('../models/challenge');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');
const Project = require('../models/project');

// Badge definitions with their criteria
const BADGE_DEFINITIONS = {
  // Achievement badges
  'first_challenge': {
    name: '🏆 First Challenge',
    description: 'Completed your first challenge',
    icon: '🏆',
    rarity: 'common',
    check: async (userId) => {
      const count = await Challenge.countDocuments({
        'submissions.userId': userId,
        'submissions.status': 'accepted'
      });
      return count >= 1;
    }
  },
  
  'challenge_veteran': {
    name: '⚡ Challenge Veteran',
    description: 'Completed 10 challenges',
    icon: '⚡',
    rarity: 'uncommon',
    check: async (userId) => {
      const count = await Challenge.countDocuments({
        'submissions.userId': userId,
        'submissions.status': 'accepted'
      });
      return count >= 10;
    }
  },
  
  'challenge_master': {
    name: '🎯 Challenge Master',
    description: 'Completed 25 challenges',
    icon: '🎯',
    rarity: 'rare',
    check: async (userId) => {
      const count = await Challenge.countDocuments({
        'submissions.userId': userId,
        'submissions.status': 'accepted'
      });
      return count >= 25;
    }
  },
  
  'daily_winner': {
    name: '🥇 Daily Winner',
    description: 'Won a daily challenge',
    icon: '🥇',
    rarity: 'uncommon',
    check: async (userId) => {
      const count = await DailyChallenge.countDocuments({
        'winners.userId': userId
      });
      return count >= 1;
    }
  },
  
  'streak_warrior': {
    name: '🔥 Streak Warrior',
    description: '7-day daily challenge streak',
    icon: '🔥',
    rarity: 'uncommon',
    check: async (userId) => {
      const streakData = await DailySubmission.aggregate([
        {
          $match: { userId, status: { $in: ['passed', 'submitted'] } }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);
      
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
      
      return streak >= 7;
    }
  },
  
  'project_creator': {
    name: '💡 Project Creator',
    description: 'Submitted your first project',
    icon: '💡',
    rarity: 'common',
    check: async (userId) => {
      const count = await Project.countDocuments({
        userId,
        status: { $in: ['completed', 'published'] }
      });
      return count >= 1;
    }
  },
  
  'prolific_creator': {
    name: '🚀 Prolific Creator',
    description: 'Completed 5 projects',
    icon: '🚀',
    rarity: 'uncommon',
    check: async (userId) => {
      const count = await Project.countDocuments({
        userId,
        status: { $in: ['completed', 'published'] }
      });
      return count >= 5;
    }
  },
  
  'community_hero': {
    name: '🌟 Community Hero',
    description: 'High community score (8.0+)',
    icon: '🌟',
    rarity: 'rare',
    check: async (userId) => {
      // This would use the same community score calculation as leaderboard
      const challengeSubmissions = await Challenge.countDocuments({
        'submissions.userId': userId,
        'submissions.status': 'accepted'
      });
      
      const projectsSubmitted = await Project.countDocuments({
        userId,
        status: { $in: ['completed', 'published'] }
      });
      
      // Simple community score calculation
      let score = (challengeSubmissions * 2) + (projectsSubmitted * 3);
      const normalizedScore = Math.min(score / 10, 10);
      
      return normalizedScore >= 8.0;
    }
  },
  
  'early_adopter': {
    name: '🌱 Early Adopter',
    description: 'Joined in the first month',
    icon: '🌱',
    rarity: 'legendary',
    check: async (userId) => {
      const user = await User.findById(userId).select('createdAt');
      if (!user) return false;
      
      const daysSinceCreation = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= 30; // At least 30 days ago
    }
  },
  
  'top_performer': {
    name: '👑 Top Performer',
    description: 'Reached top 10 in leaderboard',
    icon: '👑',
    rarity: 'epic',
    check: async (userId) => {
      const usersWithMorePoints = await User.countDocuments({ 
        points: { $gt: 0 } 
      });
      
      const user = await User.findById(userId).select('points');
      if (!user || !user.points) return false;
      
      const usersAbove = await User.countDocuments({ 
        points: { $gt: user.points } 
      });
      
      const rank = usersAbove + 1;
      return rank <= 10;
    }
  }
};

// Get all badges for a user
async function getUserBadges(userId) {
  try {
    const badges = [];
    
    for (const [badgeKey, badgeDef] of Object.entries(BADGE_DEFINITIONS)) {
      try {
        const earned = await badgeDef.check(userId);
        if (earned) {
          badges.push({
            id: badgeKey,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
            rarity: badgeDef.rarity
          });
        }
      } catch (error) {
        console.error(`Error checking badge ${badgeKey}:`, error);
      }
    }
    
    return badges;
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

// Get badges by rarity
function getBadgesByRarity(rarity) {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([_, badge]) => badge.rarity === rarity)
    .map(([key, badge]) => ({
      id: key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity
    }));
}

// Get all badge definitions
function getAllBadgeDefinitions() {
  return Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => ({
    id: key,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    rarity: badge.rarity
  }));
}

module.exports = {
  getUserBadges,
  getBadgesByRarity,
  getAllBadgeDefinitions,
  BADGE_DEFINITIONS
};
