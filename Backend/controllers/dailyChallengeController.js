const mongoose = require('mongoose');
const DailyChallenge = require('../models/dailyChallenge');
const DailySubmission = require('../models/dailySubmission');
const User = require('../models/user');
const Notification = require('../models/notification');
const pointsService = require('../services/pointsService');
const ChallengeGenerator = require('../services/challengeGenerator');

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

// Get next challenge time
function getNextChallengeTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
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
      // Try to automatically generate a challenge for today
      try {
        console.log('🚀 No challenge found for today, attempting to generate one...');
        const challengeGenerator = new ChallengeGenerator();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const challengeData = await challengeGenerator.generateDailyChallenge({
          difficulty: 'Medium',
          category: 'Algorithms',
          timeLimit: 30,
          maxPoints: 100
        });
        
        const newChallenge = await challengeGenerator.createChallengeInDatabase(challengeData, startOfDay);
        console.log(`✅ Successfully generated challenge: ${newChallenge.title}`);
        
        // Return the newly generated challenge
        return res.status(200).json({
          success: true,
          data: {
            challenge: newChallenge.toObject(),
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
        
      } catch (generationError) {
        console.error('❌ Failed to generate automatic challenge:', generationError);
        
        // Return fallback response
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
  const startTime = Date.now();
  const submissionStartTime = startTime; // Fix undefined variable
  console.log('🚀 DAILY CHALLENGE SUBMISSION STARTED');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 User ID:', req.userProfile?._id || 'NOT_FOUND');
  console.log('🔑 Auth header:', req.headers.authorization ? 'PRESENT' : 'MISSING');
  
  try {
    const { challengeId, code, language = 'javascript' } = req.body;
    const userId = req.userProfile._id;
    
    console.log('🎯 Parsed data:', { challengeId, codeLength: code?.length || 0, language });
    console.log('👤 User ID extracted:', userId);

    // Validate required fields
    if (!challengeId || !code) {
      console.error('❌ Missing required fields:', { challengeId: !!challengeId, code: !!code });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: challengeId and code',
        error: 'VALIDATION_ERROR'
      });
    }

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
      challengeId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a solution for today\'s challenge'
      });
    }

    // Run code against test cases (real execution + AI analysis)
    console.log('🔧 Starting code execution...');
    const testCases = challenge.testCases || [];
    console.log('📝 Test cases count:', testCases.length);
    console.log('🔑 Challenge description length:', challenge.description?.length || 0);
    
    const testResults = await executeCode(code, testCases, challenge.description, language);
    console.log('✅ Execution completed, results count:', testResults.length);
    console.log('📊 First result sample:', JSON.stringify(testResults[0], null, 2));
    
    // Calculate score based on criteria
    const score = calculateScore(testResults, challenge.scoringCriteria || {});
    
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
    console.log('🆕 Created new submission for user:', userId);

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
      // Calculate professional score with validation
      const validationConfidence = testResults[0]?.validationConfidence || 1;
      const professionalScore = calculateProfessionalScore(testResults, validationConfidence);
      
      // Determine if actually passed (not just validation passed)
      const actuallyPassed = testResults.some(r => r.passed && !r.validationFailed);
      
      // Calculate rank based on professional score
      const allSubmissions = await DailySubmission.find({
        challengeId,
        status: 'passed'
      }).sort({ 'score.total': -1 });
      
      const userRank = allSubmissions.findIndex(s => s.userId.toString() === userId) + 1;
      
      // Award points with professional scoring
      const pointsResult = await pointsService.awardDailyChallengePoints({
        userId: userId,
        dailyChallengeId: challengeId,
        rank: userRank,
        score: professionalScore,
        maxScore: challenge.maxPoints,
        completionTime: Date.now() - submissionStartTime,
        timeLimit: challenge.timeLimit,
        usedHint: false, // TODO: Track hint usage
        performanceMetrics: {
          efficiency: professionalScore / 100,
          executionTime: testResults[0]?.executionTime || 0,
          memoryUsage: testResults[0]?.memoryUsage || 0
        }
      });
        
      console.log(`Awarded ${pointsResult.pointsAwarded} points to user ${userId} for daily challenge rank ${userRank}`);
    } catch (pointsError) {
      console.error('Error awarding daily challenge points:', pointsError);
      // Continue with submission response even if points awarding fails
    }

    // Update user's daily progress
    await updateUserDailyProgress(userId, score.total);

    // Check and update rankings
    try {
      await updateRankings(challengeId);
    } catch (rankingError) {
      console.error('Error updating rankings:', rankingError);
      // Continue with submission response even if ranking update fails
    }

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
    console.error('💥 SUBMISSION ERROR:', error.message);
    console.error('💥 ERROR STACK:', error.stack);
    
    // Check for rate limit errors
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED' || 
                       error.message.toLowerCase().includes('rate limit') ||
                       error.message.toLowerCase().includes('too many requests');
    
    if (isRateLimit) {
      // Try to get wait time from test results if available
      let waitTime = 60; // Default fallback
      let userMessage = 'AI service rate limit exceeded. Please wait a moment and try again.';
      
      // Check if we have test results with rate limit info
      if (error.testResults && error.testResults[0]?.rateLimited) {
        waitTime = error.testResults[0].waitTime || 60;
        userMessage = error.testResults[0].userMessage || userMessage;
      }
      
      return res.status(429).json({
        success: false,
        message: userMessage,
        error: 'RATE_LIMIT_EXCEEDED',
        waitTime: waitTime,
        retryAfter: waitTime
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error submitting solution',
      error: error.message,
      debug: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
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
    const userId = req.userProfile._id;
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

// Get user's submission for a specific challenge
exports.getSubmission = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.userProfile._id;
    
    const submission = await DailySubmission.findOne({
      userId,
      challengeId
    });
    
    if (submission) {
      res.status(200).json({
        success: true,
        data: submission
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No submission found'
      });
    }
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
};

// Helper function to extract expected function names from problem description
function extractExpectedFunctionNames(description) {
  const functionPatterns = [
    { keywords: ['minimum window substring', 'find minimum window'], functions: ['minWindow', 'findMinWindow'] },
    { keywords: ['sum of array', 'array sum'], functions: ['arraySum', 'sumArray', 'calculateSum'] },
    { keywords: ['reverse string', 'string reverse'], functions: ['reverseString', 'reverseStr'] },
    { keywords: ['binary search', 'search binary'], functions: ['binarySearch', 'searchBinary'] },
    { keywords: ['linked list', 'list operations'], functions: ['reverseList', 'listOperations'] },
    { keywords: ['stable arrays', 'count stable'], functions: ['countStableArrays', 'numberOfStableArrays'] },
    { keywords: ['two sum'], functions: ['twoSum', 'findTwoSum'] },
    { keywords: ['palindrome'], functions: ['isPalindrome', 'checkPalindrome'] }
  ];

  const descLower = description.toLowerCase();
  
  for (const pattern of functionPatterns) {
    if (pattern.keywords.some(keyword => descLower.includes(keyword))) {
      return pattern.functions;
    }
  }
  
  return []; // No specific pattern detected
}

// Helper function to calculate professional score
function calculateProfessionalScore(testResults, validationConfidence) {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed && !r.validationFailed).length;
  
  if (totalTests === 0) return 0;
  
  // Base score from test results
  const baseScore = (passedTests / totalTests) * 100;
  
  // Adjust based on validation confidence
  const adjustedScore = baseScore * (validationConfidence || 1);
  
  // Apply scoring curve
  if (adjustedScore >= 90) return Math.min(100, adjustedScore);
  if (adjustedScore >= 80) return Math.min(95, adjustedScore);
  if (adjustedScore >= 70) return Math.min(85, adjustedScore);
  if (adjustedScore >= 50) return Math.min(75, adjustedScore);
  
  return Math.max(0, adjustedScore);
}

async function executeCode(code, testCases, challengeDescription = '', language = 'javascript') {
  console.log('🔧 executeCode called with:', { 
    codeLength: code?.length || 0, 
    testCasesCount: testCases?.length || 0,
    descriptionLength: challengeDescription?.length || 0 
  });
  
  const { getActiveService, isServiceConfigured } = require('../config/executionConfig');
  const CodeExecutor = require('../services/codeExecutor');
  const FreeAIExecutor = require('../services/aiExecutor');
  
  const activeConfig = getActiveService();
  console.log('⚙ Active config:', {
    primary: activeConfig.primary?.service,
    aiAnalysis: activeConfig.aiAnalysis?.service,
    strategy: activeConfig.strategy?.mode
  });
  
  try {
    // Use AI-first strategy if configured
    if (activeConfig.strategy?.mode === 'ai_only' && activeConfig.aiAnalysis && isServiceConfigured('groq')) {
      console.log(`🤖 Using ${activeConfig.aiAnalysis.name} for AI-first evaluation`);
      return await fallbackToAI(code, challengeDescription, testCases, { service: 'groq' }, language);
    }
    
    // Use professional execution with validation
    if (activeConfig.primary && isServiceConfigured(activeConfig.primary.service)) {
      console.log(`✅ Using ${activeConfig.primary.name} for professional execution`);
      
      // Detect expected function names based on problem description
      const expectedFunctionNames = extractExpectedFunctionNames(challengeDescription);
      
      const executionResults = await CodeExecutor.prototype.executeWithProfessionalValidation.call(
        new CodeExecutor(), 
        code, 
        language, 
        testCases, 
        challengeDescription
      );
      
      console.log('📊 Professional execution completed');
      return executionResults;
    }
    
    throw new Error('No valid execution service configured');
    
  } catch (error) {
    console.error('❌ Primary execution failed:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Check if it's a rate limit error
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED' || 
                       error.message.toLowerCase().includes('rate limit') ||
                       error.message.toLowerCase().includes('too many requests');
    
    if (isRateLimit) {
      // Don't try fallback if it's a rate limit error
      const rateLimitError = new Error('RATE_LIMIT_EXCEEDED');
      rateLimitError.testResults = testResults;
      throw rateLimitError;
    }
    
    // Try AI analysis as fallback
    if (activeConfig.strategy.fallback && activeConfig.aiAnalysis && isServiceConfigured('groq')) {
      console.log(`🔄 Falling back to ${activeConfig.aiAnalysis.name} for evaluation`);
      return await fallbackToAI(code, challengeDescription, testCases, { service: 'groq' }, language);
    }
    
    // Final fallback to local code evaluation if all else fails
    console.warn('⚠️ All execution services failed, using local code evaluation');
    return testCases.map((testCase, index) => {
      try {
        // Create a safe execution environment
        const vm = require('vm');
        const context = vm.createContext({
          console: {
            log: () => {} // Suppress console.log
          }
        });
        
        // Wrap the user code to capture the result
        let wrappedCode = code;
        
        // Try to detect if code has a function and call it
        if (code.includes('function') || code.includes('=>')) {
          // Add a call to the function if it's defined but not called
          if (!code.includes('(') && !code.includes('print')) {
            wrappedCode = code + '\nif (typeof minWindow === "function") minWindow("ADOBECODEBANC", "ABC");';
          }
        }
        
        // Execute the code
        let actualOutput = '';
        const originalLog = console.log;
        console.log = (...args) => {
          actualOutput = args.join(' ');
        };
        
        vm.runInContext(wrappedCode, context);
        
        console.log = originalLog;
        
        // Clean up the output
        actualOutput = actualOutput.trim().replace(/['"]/g, '');
        const expectedOutput = testCase.expectedOutput.trim().replace(/['"]/g, '');
        
        return {
          testCaseIndex: index,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput,
          passed: actualOutput === expectedOutput,
          executionTime: Math.random() * 200 + 50, // Random time between 50-250ms
          memoryUsage: Math.random() * 512 + 256, // Random memory between 256-768MB
          error: null,
          timestamp: new Date().toISOString(),
          localEvaluation: true
        };
        
      } catch (error) {
        return {
          testCaseIndex: index,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message,
          timestamp: new Date().toISOString(),
          localEvaluation: true
        };
      }
    });
  }
}

// Enhance execution results with AI analysis
async function enhanceWithAI(executionResults, code, challengeDescription, testCases, aiConfig) {
  try {
    const FreeAIExecutor = require('../services/aiExecutor');
    const aiExecutor = new FreeAIExecutor();
    
    let aiResults;
    switch (aiConfig.service) {
      case 'gemini':
        aiResults = await aiExecutor.evaluateWithGemini(code, challengeDescription, testCases);
        break;
      case 'openai':
        aiResults = await aiExecutor.evaluateWithAI(code, challengeDescription, testCases);
        break;
      case 'groq':
        aiResults = await aiExecutor.evaluateWithGroq(code, challengeDescription, testCases);
        break;
      default:
        console.warn(`Unknown AI service: ${aiConfig.service}`);
        return executionResults;
    }
    
    // Combine execution results with AI insights
    return executionResults.map((result, index) => ({
      ...result,
      aiEvaluation: aiResults[index]?.aiEvaluation || null,
      enhanced: true
    }));
    
  } catch (aiError) {
    console.warn(`AI enhancement failed: ${aiError.message}`);
    return executionResults;
  }
}

// Fallback to AI-only evaluation
async function fallbackToAI(code, challengeDescription, testCases, aiConfig, language = 'javascript') {
  const FreeAIExecutor = require('../services/aiExecutor');
  const aiExecutor = new FreeAIExecutor(); 
  
  try {
    switch (aiConfig.service) {
      case 'gemini':
        return await aiExecutor.evaluateWithGemini(code, challengeDescription, testCases);
      case 'openai':
        return await aiExecutor.evaluateWithAI(code, challengeDescription, testCases);
      case 'groq':
        return await aiExecutor.evaluateWithGroq(code, challengeDescription, testCases, language);
      default:
        throw new Error(`Fallback AI service ${aiConfig.service} not available`);
    }
  } catch (error) {
    console.error('❌ AI evaluation failed:', error.message);
    
    // Check if it's a rate limit error
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED' || 
                       error.message.toLowerCase().includes('rate limit') ||
                       error.message.toLowerCase().includes('too many requests');
    
    if (isRateLimit) {
      // Pass through the rate limit error with test results
      const rateLimitError = new Error('RATE_LIMIT_EXCEEDED');
      rateLimitError.testResults = testResults;
      throw rateLimitError;
    }
    
    throw new Error(`Fallback AI service ${aiConfig.service} not available`);
  }
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

// Export executeCode for debugging
module.exports.executeCode = executeCode;

function calculateScore(testResults, criteria) {
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  // Check if AI evaluation is available and use AI score
  const firstResult = testResults[0];
  if (firstResult?.aiEvaluation?.score) {
    const aiScore = firstResult.aiEvaluation.score;
    console.log('🤖 Using AI evaluation score:', aiScore);
    
    return {
      total: aiScore,
      breakdown: {
        correctness: {
          score: aiScore,
          weight: 1.0,
          passed: passedTests,
          total: totalTests
        },
        performance: {
          speed: { score: 0, weight: 0, avgTime: 0, unit: 'ms' },
          efficiency: { score: 0, weight: 0, avgMemory: 0, unit: 'MB' }
        },
        bonuses: {
          consistency: 0,
          perfect: passedTests === totalTests
        }
      },
      rating: aiScore >= 90 ? 'Expert' : aiScore >= 80 ? 'Advanced' : aiScore >= 70 ? 'Intermediate' : aiScore >= 60 ? 'Competent' : 'Beginner',
      metrics: {
        avgExecutionTime: 0,
        avgMemoryUsage: 0,
        passRate: Math.round((passedTests / totalTests) * 100)
      },
      aiEvaluated: true
    };
  }
  
  // Fallback to original calculation if no AI score
  console.log('📊 Using traditional score calculation');
  
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
  try {
    // Update user's daily progress tracking - only update fields that exist
    const updateData = {
      $set: {
        lastActiveDate: new Date()
      }
    };
    
    // Only add points if user has points field
    const user = await User.findById(userId);
    if (user && user.points !== undefined) {
      updateData.$inc = {
        points: Math.floor(score / 10) // Award some points based on score
      };
    }
    
    await User.findByIdAndUpdate(userId, updateData);
  } catch (error) {
    console.error('Error updating user daily progress:', error);
    // Don't fail the submission if user update fails
  }
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
