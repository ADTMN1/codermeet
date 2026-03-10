const cron = require('node-cron');
const DailyChallenge = require('../models/dailyChallenge');
const ChallengeGenerator = require('./challengeGenerator');
const Notification = require('../models/notification');

class DailyChallengeScheduler {
  constructor() {
    this.challengeGenerator = new ChallengeGenerator();
    this.isRunning = false;
    this.lastGenerationTime = null;
  }

  // Initialize the scheduler
  initialize() {
    console.log('🚀 Initializing Daily Challenge Scheduler...');
    
    // Schedule challenge generation for every day at 12:00 AM UTC
    cron.schedule('0 0 * * *', async () => {
      await this.generateDailyChallenge();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Schedule challenge generation for every day at 6:00 AM local time
    cron.schedule('0 6 * * *', async () => {
      await this.ensureTodayChallenge();
    }, {
      scheduled: true,
      timezone: 'Africa/Addis_Ababa'
    });

    // Check for missing challenges every hour
    cron.schedule('0 * * * *', async () => {
      await this.checkMissingChallenges();
    });

    // Generate initial challenge if none exists for today
    this.ensureTodayChallenge();

    console.log('✅ Daily Challenge Scheduler initialized successfully');
  }

  // Generate challenge for today
  async generateDailyChallenge() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Challenge generation already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🎯 Starting automatic daily challenge generation...');

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Check if challenge already exists for today
      const existingChallenge = await DailyChallenge.findOne({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      if (existingChallenge) {
        console.log(`✅ Challenge already exists for today: ${existingChallenge.title}`);
        this.isRunning = false;
        return existingChallenge;
      }

      // Generate new challenge with varied difficulty
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const categories = ['Algorithms', 'Data Structures', 'Problem Solving', 'Arrays', 'Strings'];
      
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Generate challenge using AI
      const challengeData = await this.challengeGenerator.generateDailyChallenge({
        difficulty,
        category,
        timeLimit: 30,
        maxPoints: 100,
        topic: `Daily ${category} challenge - ${difficulty} difficulty`
      });

      // Save challenge to database
      const newChallenge = await this.challengeGenerator.createChallengeInDatabase(challengeData, startOfDay);
      
      this.lastGenerationTime = new Date();
      
      // Send notification to all users
      await this.notifyNewChallenge(newChallenge);

      console.log(`🎉 Successfully generated daily challenge: ${newChallenge.title}`);
      return newChallenge;

    } catch (error) {
      console.error('❌ Error generating daily challenge:', error);
      
      // Try to create a fallback challenge
      await this.createFallbackChallenge();
      
    } finally {
      this.isRunning = false;
    }
  }

  // Ensure today's challenge exists (called on startup and at 6 AM)
  async ensureTodayChallenge() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const existingChallenge = await DailyChallenge.findOne({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        isActive: true
      });

      if (!existingChallenge) {
        console.log('⚠️ No challenge found for today, generating one...');
        await this.generateDailyChallenge();
      } else {
        console.log(`✅ Today's challenge already exists: ${existingChallenge.title}`);
      }

    } catch (error) {
      console.error('❌ Error ensuring today\'s challenge:', error);
    }
  }

  // Check for missing challenges in the last 7 days
  async checkMissingChallenges() {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const missingDays = [];
      const checkDate = new Date(sevenDaysAgo);

      while (checkDate <= today) {
        const startOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        const endOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + 1);

        const existingChallenge = await DailyChallenge.findOne({
          date: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        });

        if (!existingChallenge) {
          missingDays.push(new Date(startOfDay));
        }

        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (missingDays.length > 0) {
        console.log(`⚠️ Found ${missingDays.length} missing challenge(s), generating...`);
        
        for (const date of missingDays) {
          await this.generateChallengeForDate(date);
        }
      }

    } catch (error) {
      console.error('❌ Error checking missing challenges:', error);
    }
  }

  // Generate challenge for a specific date
  async generateChallengeForDate(date) {
    try {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const categories = ['Algorithms', 'Data Structures', 'Problem Solving'];
      
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const challengeData = await this.challengeGenerator.generateDailyChallenge({
        difficulty,
        category,
        timeLimit: 30,
        maxPoints: 100
      });

      const newChallenge = await this.challengeGenerator.createChallengeInDatabase(challengeData, date);
      
      console.log(`✅ Generated challenge for ${date.toDateString()}: ${newChallenge.title}`);
      return newChallenge;

    } catch (error) {
      console.error(`❌ Error generating challenge for ${date.toDateString()}:`, error);
      return null;
    }
  }

  // Create fallback challenge if AI generation fails
  async createFallbackChallenge() {
    try {
      console.log('🔄 Creating fallback challenge...');
      
      const fallbackChallenges = [
        {
          title: "Array Sum Calculator",
          description: "Write a function that calculates the sum of all elements in an array.",
          difficulty: "Easy",
          category: "Arrays",
          timeLimit: 15,
          maxPoints: 50,
          hint: "Use a simple loop or array.reduce() method",
          examples: [
            {
              input: "[1, 2, 3, 4, 5]",
              output: "15",
              explanation: "Sum of all numbers from 1 to 5 is 15"
            }
          ],
          constraints: [
            "Array will contain only numbers",
            "Array length will be between 1 and 1000"
          ],
          testCases: [
            {
              input: "[1, 2, 3]",
              expectedOutput: "6",
              weight: 1
            },
            {
              input: "[-1, 5, -3]",
              expectedOutput: "1",
              weight: 1
            }
          ]
        },
        {
          title: "String Reverser",
          description: "Write a function that reverses a given string.",
          difficulty: "Easy",
          category: "Strings",
          timeLimit: 15,
          maxPoints: 50,
          hint: "You can use split(), reverse(), and join() methods",
          examples: [
            {
              input: "hello",
              output: "olleh",
              explanation: "The string 'hello' reversed is 'olleh'"
            }
          ],
          constraints: [
            "String length will be between 1 and 1000",
            "String may contain any characters"
          ],
          testCases: [
            {
              input: "abc",
              expectedOutput: "cba",
              weight: 1
            },
            {
              input: "racecar",
              expectedOutput: "racecar",
              weight: 1
            }
          ]
        }
      ];

      const fallbackData = fallbackChallenges[Math.floor(Math.random() * fallbackChallenges.length)];
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const challengeDoc = {
        date: startOfDay,
        title: fallbackData.title,
        description: fallbackData.description,
        difficulty: fallbackData.difficulty,
        category: fallbackData.category,
        timeLimit: fallbackData.timeLimit,
        maxPoints: fallbackData.maxPoints,
        hint: fallbackData.hint,
        examples: fallbackData.examples,
        constraints: fallbackData.constraints,
        testCases: fallbackData.testCases,
        scoringCriteria: {
          correctness: { weight: 0.6, description: "All test cases pass correctly" },
          speed: { weight: 0.2, description: "Efficient time complexity" },
          efficiency: { weight: 0.2, description: "Optimal space complexity" }
        },
        prizes: [
          {
            rank: 1,
            points: 50,
            description: "First place prize"
          }
        ],
        tags: [fallbackData.category.toLowerCase(), fallbackData.difficulty.toLowerCase()],
        solutionApproach: "Use basic programming concepts to solve the problem",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedChallenge = new DailyChallenge(challengeDoc);
      await savedChallenge.save();

      console.log(`✅ Created fallback challenge: ${fallbackData.title}`);
      return savedChallenge;

    } catch (error) {
      console.error('❌ Error creating fallback challenge:', error);
      return null;
    }
  }

  // Notify users about new challenge
  async notifyNewChallenge(challenge) {
    try {
      const User = require('../models/user');
      
      // Get all active users
      const users = await User.find({ isActive: true }).select('_id');
      
      // Create notifications in bulk
      const notifications = users.map(user => ({
        userId: user._id,
        type: 'daily_challenge',
        title: 'New Daily Challenge Available!',
        message: `Today's challenge: ${challenge.title} (${challenge.difficulty})`,
        data: {
          challengeId: challenge._id,
          difficulty: challenge.difficulty,
          maxPoints: challenge.maxPoints
        },
        isRead: false,
        createdAt: new Date()
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`📢 Sent notifications to ${notifications.length} users about new challenge`);
      }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastGenerationTime: this.lastGenerationTime,
      nextGenerationTime: this.getNextGenerationTime()
    };
  }

  // Get next scheduled generation time
  getNextGenerationTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tomorrow;
  }
}

module.exports = DailyChallengeScheduler;
