const mongoose = require('mongoose');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');
const User = require('../models/user');
const Notification = require('../models/notification');
const pointsService = require('../services/pointsService');

// Get daily challenge statistics (AI-generated only)
exports.getDailyChallengeStats = async (req, res) => {
  try {
    // Get AI-generated daily challenge stats
    const dailyStats = await DailyChallenge.aggregate([
      {
        $group: {
          _id: null,
          totalGenerated: { $sum: 1 },
          activeDailyChallenges: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          easyChallenges: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] }
          },
          mediumChallenges: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] }
          },
          hardChallenges: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] }
          },
          avgTimeLimit: { $avg: '$timeLimit' },
          avgMaxPoints: { $avg: '$maxPoints' },
          totalWinners: { $sum: { $size: { $ifNull: ['$winners', []] } } }
        }
      }
    ]);

    // Get category breakdown for daily challenges
    const categoryStats = await DailyChallenge.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgTimeLimit: { $avg: '$timeLimit' },
          avgMaxPoints: { $avg: '$maxPoints' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent daily challenges (last 30 days)
    const recentDailyChallenges = await DailyChallenge.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
    .select('title difficulty category date isActive createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get generation trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const generationTrends = await DailyChallenge.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = dailyStats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        totalGenerated: stats.totalGenerated || 0,
        activeDailyChallenges: stats.activeDailyChallenges || 0,
        easyChallenges: stats.easyChallenges || 0,
        mediumChallenges: stats.mediumChallenges || 0,
        hardChallenges: stats.hardChallenges || 0,
        avgTimeLimit: Math.round(stats.avgTimeLimit || 0),
        avgMaxPoints: Math.round(stats.avgMaxPoints || 0),
        totalWinners: stats.totalWinners || 0,
        successRate: stats.totalGenerated > 0 ? 
          Math.round((stats.activeDailyChallenges / stats.totalGenerated) * 100) : 0,
        mostUsedCategory: categoryStats.length > 0 ? categoryStats[0]._id : 'N/A',
        mostUsedDifficulty: [
          { name: 'Easy', count: stats.easyChallenges || 0 },
          { name: 'Medium', count: stats.mediumChallenges || 0 },
          { name: 'Hard', count: stats.hardChallenges || 0 }
        ].sort((a, b) => b.count - a.count)[0]?.name || 'N/A',
        byCategory: categoryStats,
        recentActivity: recentDailyChallenges,
        generationTrends,
        overview: {
          totalChallenges: stats.totalGenerated || 0,
          activeChallenges: stats.activeDailyChallenges || 0,
          avgTimeLimit: Math.round(stats.avgTimeLimit || 0),
          avgMaxPoints: Math.round(stats.avgMaxPoints || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching daily challenge stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily challenge statistics',
      error: error.message
    });
  }
};

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

    // Create notification for admin users about new daily challenge submission
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    
    for (const admin of adminUsers) {
      await Notification.createNotification({
        recipient: admin._id,
        sender: userId,
        title: 'New Daily Challenge Submission',
        message: `New solution submitted for daily challenge: ${challenge.title}`,
        type: 'challenge_submission',
        metadata: {
          priority: 'medium',
          challengeId: challengeId,
          userId: userId,
          score: score.total
        }
      });
    }

    // Award points for daily challenge completion
    try {
      // Calculate rank based on today's submissions
      const todaySubmissions = await DailySubmission.find({
        challengeId,
        status: 'passed'
      }).sort({ 'score.total': -1 });
      
      const userRank = todaySubmissions.findIndex(s => s.userId.toString() === userId) + 1;
      
      const pointsResult = await pointsService.awardDailyChallengePoints({
        userId,
        dailyChallengeId: challengeId,
        rank: userRank,
        score: score.total,
        maxScore: challenge.maxPoints
      });
      
      console.log(`Awarded ${pointsResult.pointsAwarded} points to user ${userId} for daily challenge rank ${userRank}`);
    } catch (pointsError) {
      console.error('Error awarding daily challenge points:', pointsError);
      // Continue with submission response even if points awarding fails
    }

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
  const CodeExecutor = require('../services/codeExecutor');
  const executor = new CodeExecutor();
  
  // Choose your execution method:
  // 1. Judge0 CE (Free, 100 requests/hour)
  // return await executor.executeWithJudge0(code, 'javascript', testCases);
  
  // 2. Docker Container (Self-hosted, Full control)
  // return await executor.executeWithDocker(code, 'javascript', testCases);
  
  // 3. AI Evaluation (Advanced, requires OpenAI API key)
  // return await executor.evaluateWithAI(code, challengeDescription, testCases);
  
  // For now, keep the mock implementation
  return testCases.map((testCase, index) => {
    // Simulate different execution scenarios based on code complexity
    const codeComplexity = estimateCodeComplexity(code);
    const baseTime = 50 + (codeComplexity * 10); // Base execution time
    const baseMemory = 10 + (codeComplexity * 5); // Base memory usage
    
    // Add some randomness to simulate real execution variations
    const timeVariation = Math.random() * 0.3 - 0.15; // ±15% variation
    const memoryVariation = Math.random() * 0.2 - 0.1; // ±10% variation
    
    const executionTime = Math.max(1, baseTime * (1 + timeVariation));
    const memoryUsage = Math.max(1, baseMemory * (1 + memoryVariation));
    
    // Simulate pass/fail based on code quality (mock logic)
    const passProbability = Math.min(0.95, 0.7 + (code.length / 1000)); // Longer code = higher chance of passing
    const passed = Math.random() < passProbability;
    
    return {
      testCaseIndex: index,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: passed ? testCase.expectedOutput : `Incorrect output for test ${index + 1}`,
      passed,
      executionTime: Math.round(executionTime),
      memoryUsage: Math.round(memoryUsage),
      error: passed ? null : `Test case ${index + 1} failed`,
      timestamp: new Date().toISOString()
    };
  });
}

// Estimate code complexity (mock algorithm)
function estimateCodeComplexity(code) {
  if (!code) return 1;
  
  const complexityFactors = {
    loops: (code.match(/\b(for|while|do)\b/g) || []).length * 2,
    conditionals: (code.match(/\b(if|else|switch|case)\b/g) || []).length,
    functions: (code.match(/\bfunction\b|\w+\s*\(/g) || []).length,
    recursion: (code.match(/function.*\w+\s*\([^)]*\).*\1/g) || []).length * 3,
    arrays: (code.match(/\[\]|\.push|\.pop|\.map|\.filter|\.reduce/g) || []).length
  };
  
  const totalComplexity = Object.values(complexityFactors).reduce((sum, count) => sum + count, 0);
  return Math.max(1, Math.min(10, totalComplexity / 3)); // Scale 1-10
}

function calculateScore(testResults, criteria) {
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  // 1. Correctness Score (0-100 points) - Most important
  const correctnessScore = (passedTests / totalTests) * 100;
  
  // 2. Performance Metrics
  const avgExecutionTime = testResults.reduce((sum, r) => sum + (r.executionTime || 0), 0) / totalTests;
  const avgMemoryUsage = testResults.reduce((sum, r) => sum + (r.memoryUsage || 0), 0) / totalTests;
  
  // 3. Speed Score (0-50 points) - Faster is better
  // Base time: 1000ms, Max bonus: 50 points
  const speedScore = Math.max(0, Math.min(50, 50 * (1 - avgExecutionTime / 1000)));
  
  // 4. Efficiency Score (0-30 points) - Less memory is better
  // Base memory: 100MB, Max bonus: 30 points
  const efficiencyScore = Math.max(0, Math.min(30, 30 * (1 - avgMemoryUsage / 100)));
  
  // 5. Code Quality Bonus (0-20 points) - Based on test consistency
  const allTestsPassed = passedTests === totalTests;
  const consistencyBonus = allTestsPassed ? 20 : 0;
  
  // 6. Weighted Total Score using challenge criteria
  const weights = {
    correctness: criteria.correctness?.weight || 0.6,
    speed: criteria.speed?.weight || 0.2,
    efficiency: criteria.efficiency?.weight || 0.2
  };
  
  // Normalize weights to ensure they sum to 1
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / totalWeight])
  );
  
  const weightedScore = (
    correctnessScore * normalizedWeights.correctness +
    speedScore * normalizedWeights.speed +
    efficiencyScore * normalizedWeights.efficiency +
    consistencyBonus * 0.1 // Small bonus for perfect solution
  );
  
  // 7. Performance Rating
  let rating = 'Beginner';
  if (weightedScore >= 90) rating = 'Expert';
  else if (weightedScore >= 80) rating = 'Advanced';
  else if (weightedScore >= 70) rating = 'Intermediate';
  else if (weightedScore >= 60) rating = 'Competent';
  
  return {
    total: Math.round(Math.min(100, weightedScore)), // Cap at 100
    breakdown: {
      correctness: {
        score: Math.round(correctnessScore),
        weight: normalizedWeights.correctness,
        passed: passedTests,
        total: totalTests
      },
      performance: {
        speed: {
          score: Math.round(speedScore),
          weight: normalizedWeights.speed,
          avgTime: Math.round(avgExecutionTime),
          unit: 'ms'
        },
        efficiency: {
          score: Math.round(efficiencyScore),
          weight: normalizedWeights.efficiency,
          avgMemory: Math.round(avgMemoryUsage),
          unit: 'MB'
        }
      },
      bonuses: {
        consistency: consistencyBonus,
        perfect: allTestsPassed
      }
    },
    rating,
    metrics: {
      avgExecutionTime: Math.round(avgExecutionTime),
      avgMemoryUsage: Math.round(avgMemoryUsage),
      passRate: Math.round((passedTests / totalTests) * 100)
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
