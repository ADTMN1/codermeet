const User = require('../models/user');
const Challenge = require('../models/challenge');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');

// Point awarding configuration
const POINT_CONFIG = {
  // Challenge completion points
  CHALLENGE_SUBMISSION: {
    EASY: 50,
    INTERMEDIATE: 100,
    ADVANCED: 200,
    EXPERT: 500
  },
  
  // Daily challenge points based on performance
  DAILY_CHALLENGE: {
    FIRST_PLACE: 150,
    SECOND_PLACE: 100,
    THIRD_PLACE: 75,
    PARTICIPATION: 25,
    PERFECT_SCORE: 50 // Bonus for perfect score
  },
  
  // Streak bonuses
  STREAK_BONUS: {
    DAILY_7: 50,
    DAILY_14: 150,
    DAILY_30: 500,
    CHALLENGE_5: 100,
    CHALLENGE_10: 250
  },
  
  // Achievement bonuses
  ACHIEVEMENT: {
    FIRST_CHALLENGE: 25,
    FIRST_DAILY: 10,
    PROFILE_COMPLETE: 50,
    SKILL_VERIFIED: 100
  }
};

// Award points for challenge submission
exports.awardChallengePoints = async (req, res) => {
  try {
    const { userId, challengeId, submissionId } = req;
    
    // Get user and challenge details
    const user = await User.findById(userId);
    const challenge = await Challenge.findById(challengeId);
    
    if (!user || !challenge) {
      return { success: false, message: 'User or challenge not found' };
    }
    
    // Check if points already awarded for this submission
    const existingAward = user.pointsAwarded?.find(
      award => award.submissionId?.toString() === submissionId?.toString()
    );
    
    if (existingAward) {
      return { success: false, message: 'Points already awarded for this submission' };
    }
    
    // Calculate base points based on difficulty
    const basePoints = POINT_CONFIG.CHALLENGE_SUBMISSION[challenge.difficulty] || 50;
    
    // Award points
    const newTotalPoints = user.points + basePoints;
    
    await User.findByIdAndUpdate(
      userId,
      { 
        points: newTotalPoints,
        lastPointsUpdate: new Date(),
        $push: {
          pointsAwarded: {
            submissionId,
            challengeId,
            points: basePoints,
            reason: `Challenge completion: ${challenge.title}`,
            awardedAt: new Date()
          }
        }
      }
    );
    
    // Check for streak bonuses
    await checkAndAwardStreakBonus(userId, 'challenge');
    
    return {
      success: true,
      message: `Awarded ${basePoints} points for challenge completion`,
      pointsAwarded: basePoints,
      newTotal: newTotalPoints
    };
    
  } catch (error) {
    console.error('Error awarding challenge points:', error);
    return { success: false, message: 'Server error' };
  }
};

// Award points for daily challenge completion
exports.awardDailyChallengePoints = async (req, res) => {
  try {
    const { userId, dailyChallengeId, rank, score, maxScore } = req;
    
    const user = await User.findById(userId);
    const dailyChallenge = await DailyChallenge.findById(dailyChallengeId);
    
    if (!user || !dailyChallenge) {
      return { success: false, message: 'User or daily challenge not found' };
    }
    
    // Calculate points based on rank
    let points = 0;
    let reason = '';
    
    if (rank === 1) {
      points = POINT_CONFIG.DAILY_CHALLENGE.FIRST_PLACE;
      reason = 'First place in daily challenge';
    } else if (rank === 2) {
      points = POINT_CONFIG.DAILY_CHALLENGE.SECOND_PLACE;
      reason = 'Second place in daily challenge';
    } else if (rank === 3) {
      points = POINT_CONFIG.DAILY_CHALLENGE.THIRD_PLACE;
      reason = 'Third place in daily challenge';
    } else {
      points = POINT_CONFIG.DAILY_CHALLENGE.PARTICIPATION;
      reason = 'Participation in daily challenge';
    }
    
    // Perfect score bonus
    if (score === maxScore) {
      points += POINT_CONFIG.DAILY_CHALLENGE.PERFECT_SCORE;
      reason += ' (perfect score bonus)';
    }
    
    const newTotalPoints = user.points + points;
    
    await User.findByIdAndUpdate(
      userId,
      { 
        points: newTotalPoints,
        lastPointsUpdate: new Date(),
        $push: {
          pointsAwarded: {
            dailyChallengeId,
            rank,
            score,
            points,
            reason,
            awardedAt: new Date()
          }
        }
      }
    );
    
    // Check for streak bonuses
    await checkAndAwardStreakBonus(userId, 'daily');
    
    return {
      success: true,
      message: `Awarded ${points} points for daily challenge`,
      pointsAwarded: points,
      newTotal: newTotalPoints
    };
    
  } catch (error) {
    console.error('Error awarding daily challenge points:', error);
    return { success: false, message: 'Server error' };
  }
};

// Check and award streak bonuses
async function checkAndAwardStreakBonus(userId, type) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    let bonusPoints = 0;
    let reason = '';
    
    if (type === 'daily') {
      // Check daily challenge streak (simplified - would need proper streak tracking)
      const recentSubmissions = await DailySubmission.countDocuments({
        userId,
        date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      if (recentSubmissions >= 7) {
        bonusPoints = POINT_CONFIG.STREAK_BONUS.DAILY_7;
        reason = '7-day daily challenge streak';
      } else if (recentSubmissions >= 14) {
        bonusPoints = POINT_CONFIG.STREAK_BONUS.DAILY_14;
        reason = '14-day daily challenge streak';
      }
    } else if (type === 'challenge') {
      // Check challenge completion streak
      const recentChallenges = await Challenge.countDocuments({
        'submissions.userId': userId,
        'submissions.submittedAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      if (recentChallenges >= 5) {
        bonusPoints = POINT_CONFIG.STREAK_BONUS.CHALLENGE_5;
        reason = '5 challenges completed';
      } else if (recentChallenges >= 10) {
        bonusPoints = POINT_CONFIG.STREAK_BONUS.CHALLENGE_10;
        reason = '10 challenges completed';
      }
    }
    
    if (bonusPoints > 0) {
      await User.findByIdAndUpdate(
        userId,
        { 
          points: user.points + bonusPoints,
          $push: {
            pointsAwarded: {
              points: bonusPoints,
              reason: `Streak bonus: ${reason}`,
              awardedAt: new Date()
            }
          }
        }
      );
    }
  } catch (error) {
    console.error('Error checking streak bonus:', error);
  }
}

// Get user's points history
exports.getPointsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const user = await User.findById(userId).select('pointsAwarded');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const history = user.pointsAwarded || [];
    const startIndex = (page - 1) * limit;
    const paginatedHistory = history
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .slice(startIndex, startIndex + parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: paginatedHistory,
      total: history.length,
      page: parseInt(page),
      totalPages: Math.ceil(history.length / limit)
    });
    
  } catch (error) {
    console.error('Error getting points history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
