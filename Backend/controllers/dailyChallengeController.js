const mongoose = require('mongoose');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');
const User = require('../models/user');

// Helper function to get next challenge time
function getNextChallengeTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilNext = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    nextChallengeDate: tomorrow.toISOString(),
    timeRemaining: {
      hours,
      minutes,
      totalMilliseconds: timeUntilNext
    }
  };
}

// Get today's daily challenge
exports.getTodayChallenge = async (req, res) => {
  try {
    // Create today's date range in local timezone
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('API looking for challenge between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());
    
    const challenge = await DailyChallenge.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      isActive: true
    }).populate('winners.userId', 'fullName username avatar');

    if (!challenge) {
      return res.status(200).json({
        success: true,
        data: {
          challenge: null,
          message: 'No daily challenge available today. Please check back tomorrow for a new coding challenge!',
          nextChallengeTime: getNextChallengeTime(),
          userSubmission: null,
          hasSubmitted: false,
          userStats: req.user ? {
            totalSolved: 0,
            bestScore: 0,
            prizesWon: 0,
            currentStreak: 0
          } : null
        }
      });
    }

    console.log('✅ Found challenge:', challenge.title);

    // Check if user has already submitted (only if user is authenticated)
    let userSubmission = null;
    let hasSubmitted = false;
    
    if (req.user) {
      userSubmission = await DailySubmission.findOne({
        userId: req.user.id,
        challengeId: challenge._id
      });
      hasSubmitted = !!userSubmission;
    }

    res.status(200).json({
      success: true,
      data: {
        challenge: challenge.toObject(),
        userSubmission: userSubmission,
        hasSubmitted: hasSubmitted,
        userStats: req.user ? {
          totalSolved: 0, // TODO: Get actual user stats
          bestScore: 0,
          prizesWon: 0,
          currentStreak: 0
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting today\'s challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily challenge',
      error: error.message
    });
  }
};

// Submit solution to daily challenge
exports.submitSolution = async (req, res) => {
  try {
    const { challengeId, code, language = 'javascript' } = req.body;
    const userId = req.user.id;

    // Get challenge details
    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if user has already submitted
    const existingSubmission = await DailySubmission.findOne({
      userId,
      challengeId,
      status: 'submitted'
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a solution for today\'s challenge'
      });
    }

    // Run code against test cases (mock execution)
    const testResults = await executeCode(code, challenge.testCases);
    
    // Calculate score based on criteria
    const score = calculateScore(testResults, challenge.scoringCriteria);
    
    // Create submission record
    const submission = new DailySubmission({
      userId,
      challengeId,
      date: new Date(),
      code,
      language,
      testResults,
      score,
      completionTime: {
        startedAt: new Date(),
        submittedAt: new Date(),
        totalSeconds: 300 // Mock 5 minutes
      },
      status: testResults.every(r => r.passed) ? 'passed' : 'failed'
    });

    await submission.save();

    // Update user's daily progress
    await updateUserDailyProgress(userId, score.total);

    // Check and update rankings
    await updateRankings(challengeId);

    res.status(201).json({
      success: true,
      message: 'Solution submitted successfully',
      data: {
        submission,
        score: score.total,
        passed: submission.status === 'passed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting solution',
      error: error.message
    });
  }
};

// Get daily leaderboard
exports.getDailyLeaderboard = async (req, res) => {
  try {
    // Create today's date range in local timezone
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const challenge = await DailyChallenge.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      isActive: true
    });

    if (!challenge) {
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: [],
          message: 'No daily challenge available today. Leaderboard will be available when a new challenge is posted.',
          nextChallengeTime: getNextChallengeTime(),
          challenge: {
            title: 'No Active Challenge',
            prizes: {
              first: { amount: 0, type: 'mobile_card', currency: 'ETB' },
              second: { amount: 0, type: 'mobile_card', currency: 'ETB' },
              third: { amount: 0, type: 'mobile_card', currency: 'ETB' }
            }
          }
        }
      });
    }

    const leaderboard = await DailySubmission.find({
      challengeId: challenge._id,
      status: 'passed'
    })
    .populate('userId', 'fullName username avatar')
    .sort({ 'score.total': -1, 'completionTime.totalSeconds': 1 })
    .limit(50);

    const formattedLeaderboard = leaderboard.map((submission, index) => ({
      rank: index + 1,
      user: submission.userId,
      score: submission.score.total,
      completionTime: submission.completionTime.totalSeconds,
      breakdown: submission.score.breakdown,
      isWinner: index < 3,
      prize: index < 3 ? challenge.prizes[`get${index === 0 ? 'First' : index === 1 ? 'Second' : 'Third'}`] : null
    }));

    res.status(200).json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        challenge: {
          title: challenge.title,
          prizes: challenge.prizes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// Get user's daily statistics
exports.getUserDailyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's submission
    const todaySubmission = await DailySubmission.findOne({
      userId,
      date: { $gte: today }
    }).populate('challengeId', 'title difficulty maxPoints');

    // Get user's daily stats
    const dailyStats = await DailySubmission.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          passedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] }
          },
          averageScore: { $avg: '$score.total' },
          bestScore: { $max: '$score.total' },
          currentStreak: { $sum: 1 } // Simplified streak calculation
        }
      }
    ]);

    // Get prizes won
    const prizesWon = await DailySubmission.countDocuments({
      userId,
      rank: { $lte: 3 },
      prizeEligible: true
    });

    res.status(200).json({
      success: true,
      data: {
        todaySubmission,
        stats: dailyStats[0] || {
          totalSubmissions: 0,
          passedSubmissions: 0,
          averageScore: 0,
          bestScore: 0,
          currentStreak: 0
        },
        prizesWon
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
};

// Helper functions
async function executeCode(code, testCases) {
  // Mock code execution - replace with actual code runner
  return testCases.map((testCase, index) => ({
    testCaseIndex: index,
    passed: Math.random() > 0.3, // Mock 70% pass rate
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: testCase.expectedOutput, // Mock correct output
    executionTime: Math.random() * 100,
    memoryUsage: Math.random() * 50
  }));
}

function calculateScore(testResults, criteria) {
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  // Correctness score (0-100)
  const correctnessScore = (passedTests / totalTests) * 100;
  
  // Speed bonus (faster execution = higher score)
  const avgExecutionTime = testResults.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;
  const speedBonus = Math.max(0, 50 - avgExecutionTime / 2); // Max 50 points
  
  // Efficiency bonus (less memory = higher score)
  const avgMemoryUsage = testResults.reduce((sum, r) => sum + r.memoryUsage, 0) / totalTests;
  const efficiencyBonus = Math.max(0, 30 - avgMemoryUsage); // Max 30 points
  
  // Weighted total score
  const totalScore = (
    correctnessScore * (criteria.correctness?.weight || 0.6) +
    speedBonus * (criteria.speed?.weight || 0.2) +
    efficiencyBonus * (criteria.efficiency?.weight || 0.2)
  );

  return {
    total: Math.round(totalScore),
    speed: Math.round(speedBonus),
    efficiency: Math.round(efficiencyBonus),
    correctness: Math.round(correctnessScore),
    breakdown: {
      timeBonus: Math.round(speedBonus),
      efficiencyBonus: Math.round(efficiencyBonus),
      correctnessScore: Math.round(correctnessScore)
    }
  };
}

async function updateUserDailyProgress(userId, score) {
  // Update user's daily progress tracking
  await User.findByIdAndUpdate(userId, {
    $inc: {
      'dailyStats.problemsSolved': 1,
      'dailyStats.totalScore': score,
      'dailyStats.streak': score > 0 ? 1 : 0
    },
    'dailyStats.lastActiveDate': new Date()
  });
}

async function updateRankings(challengeId) {
  const submissions = await DailySubmission.find({
    challengeId,
    status: 'passed'
  }).sort({ 'score.total': -1, 'completionTime.totalSeconds': 1 });

  // Update ranks
  for (let i = 0; i < submissions.length; i++) {
    submissions[i].rank = i + 1;
    submissions[i].prizeEligible = i < 3; // Top 3 eligible for prizes
    await submissions[i].save();
  }

  // Update challenge winners
  const challenge = await DailyChallenge.findById(challengeId);
  challenge.winners = submissions.slice(0, 3).map((submission, index) => ({
    rank: index + 1,
    userId: submission.userId,
    score: submission.score.total,
    completionTime: submission.completionTime.totalSeconds,
    prizeStatus: 'pending'
  }));
  await challenge.save();
}

// Create new daily challenge (admin only)
exports.createChallenge = async (req, res) => {
  try {
    const challengeData = req.body;
    
    // Set the date to today if not provided
    if (!challengeData.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      challengeData.date = today;
    }

    // Check if challenge already exists for this date
    const existingChallenge = await DailyChallenge.findOne({
      date: challengeData.date
    });

    if (existingChallenge) {
      return res.status(400).json({
        success: false,
        message: 'A challenge already exists for this date'
      });
    }

    const challenge = new DailyChallenge(challengeData);
    await challenge.save();

    res.status(201).json({
      success: true,
      message: 'Daily challenge created successfully',
      data: challenge
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating daily challenge',
      error: error.message
    });
  }
};

// Update daily challenge (admin only)
exports.updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const challenge = await DailyChallenge.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      data: challenge
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating daily challenge',
      error: error.message
    });
  }
};

// Get all daily challenges (admin only)
exports.getAllChallenges = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    
    let query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const challenges = await DailyChallenge.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('winners.userId', 'fullName username');

    const total = await DailyChallenge.countDocuments(query);

    // Convert Mongoose documents to plain objects to avoid circular references
    const challengesData = challenges.map(challenge => challenge.toObject());

    res.status(200).json({
      success: true,
      data: {
        challenges: challengesData,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily challenges',
      error: error.message
    });
  }
};

// Delete daily challenge (admin only)
exports.deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await DailyChallenge.findByIdAndDelete(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Also delete all submissions for this challenge
    await DailySubmission.deleteMany({ challengeId: id });

    res.status(200).json({
      success: true,
      message: 'Challenge and associated submissions deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting daily challenge',
      error: error.message
    });
  }
};
