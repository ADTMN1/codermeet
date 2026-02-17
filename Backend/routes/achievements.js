const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middlewares/auth');

// @route   GET api/achievements
// @desc    Get recent achievements for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Find user and populate their points awarded (achievements)
    const user = await User.findById(userId)
      .select('pointsAwarded fullName username avatar')
      .populate({
        path: 'pointsAwarded.submissionId',
        select: 'title challengeId'
      })
      .populate({
        path: 'pointsAwarded.challengeId', 
        select: 'title difficulty'
      })
      .populate({
        path: 'pointsAwarded.dailyChallengeId',
        select: 'title difficulty'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform points awarded into achievements
    const achievements = user.pointsAwarded
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .slice(0, limit)
      .map(pointAwarded => {
        let achievementType = 'general';
        let title = pointAwarded.reason;
        let icon = '🏆';
        let color = 'yellow';

        // Determine achievement type based on reason and points
        if (pointAwarded.reason.toLowerCase().includes('challenge') || pointAwarded.challengeId) {
          achievementType = 'challenge';
          icon = '💻';
          color = 'blue';
        } else if (pointAwarded.reason.toLowerCase().includes('daily') || pointAwarded.dailyChallengeId) {
          achievementType = 'daily';
          icon = '🌟';
          color = 'green';
        } else if (pointAwarded.points >= 50) {
          achievementType = 'milestone';
          icon = '🎯';
          color = 'purple';
        }

        // Get challenge title if available
        if (pointAwarded.challengeId && pointAwarded.challengeId.title) {
          title = pointAwarded.challengeId.title;
        } else if (pointAwarded.dailyChallengeId && pointAwarded.dailyChallengeId.title) {
          title = pointAwarded.dailyChallengeId.title;
        }

        return {
          _id: pointAwarded._id,
          title: title,
          description: pointAwarded.reason,
          points: pointAwarded.points,
          type: achievementType,
          icon: icon,
          color: color,
          awardedAt: pointAwarded.awardedAt,
          rank: pointAwarded.rank,
          score: pointAwarded.score
        };
      });

    res.json({
      success: true,
      data: {
        achievements,
        total: user.pointsAwarded.length,
        user: {
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
          totalPoints: user.points
        }
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
