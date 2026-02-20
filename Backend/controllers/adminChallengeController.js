// Admin Challenge Generation Controller
const ChallengeGenerator = require('../services/challengeGenerator');
const DailyChallenge = require('../models/dailyChallenge');

class AdminChallengeController {
  constructor() {
    this.generator = new ChallengeGenerator();
    
    // Bind all methods to preserve `this` context
    this.generateChallenge = this.generateChallenge.bind(this);
    this.generateAndCreateChallenge = this.generateAndCreateChallenge.bind(this);
    this.generateWeeklyChallenges = this.generateWeeklyChallenges.bind(this);
    this.generateTopicChallenge = this.generateTopicChallenge.bind(this);
    this.autoGenerateChallenges = this.autoGenerateChallenges.bind(this);
    this.bulkGenerate = this.bulkGenerate.bind(this);
    this.getGenerationStats = this.getGenerationStats.bind(this);
    this.getAllChallenges = this.getAllChallenges.bind(this);
    this.getAvailableDates = this.getAvailableDates.bind(this);
    this.previewChallenge = this.previewChallenge.bind(this);
  }

  // Generate single challenge (preview only)
  async generateChallenge(req, res) {
    try {
      console.log('🧠 Debug - generateChallenge called');
      console.log('🧠 Debug - Request body:', req.body);
      console.log('🧠 Debug - Request user:', req.user);
      console.log('🧠 Debug - Request headers:', req.headers);
      
      const { difficulty, category, timeLimit, maxPoints, topic } = req.body;
      
      console.log('🎯 Debug - Generation options:', {
        difficulty,
        category,
        timeLimit,
        maxPoints,
        topic
      });

      // Validate required fields
      if (!difficulty || !category || !timeLimit || !maxPoints) {
        console.log('❌ Debug - Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: difficulty, category, timeLimit, maxPoints'
        });
      }

      console.log('✅ Debug - Validation passed, generating challenge...');
      
      // Generate challenge using AI
      const challengeData = await this.generator.generateDailyChallenge({
        difficulty,
        category,
        timeLimit,
        maxPoints,
        topic
      });

      console.log('✅ Debug - Challenge generated successfully');
      console.log('🎯 Debug - Generated title:', challengeData.title);
      console.log('🎯 Debug - Generated category:', challengeData.category);

      res.status(200).json({
        success: true,
        message: 'Challenge generated successfully',
        data: challengeData
      });

    } catch (error) {
      console.error('🚨 Debug - Error in generateChallenge:', error);
      console.error('🚨 Debug - Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate challenge'
      });
    }
  }

  // Generate and save challenge immediately
  async generateAndCreateChallenge(req, res) {
    try {
      console.log('🧠 Debug - generateAndCreateChallenge called');
      console.log('🧠 Debug - Request body:', req.body);
      console.log('🧠 Debug - Request user:', req.user);
      
      const { 
        difficulty, 
        category, 
        timeLimit, 
        maxPoints,
        scheduleFor,
        activateImmediately 
      } = req.body;

      console.log('🎯 Debug - Generation options:', {
        difficulty, 
        category, 
        timeLimit, 
        maxPoints,
        scheduleFor,
        activateImmediately
      });

      // Generate challenge with AI
      console.log('✅ Debug - Generating challenge with AI...');
      const challengeData = await this.generator.generateDailyChallenge({
        difficulty: difficulty || 'Medium',
        category: category || 'Algorithms',
        timeLimit: timeLimit || 30,
        maxPoints: maxPoints || 100
      });

      console.log('✅ Debug - AI generation complete');
      console.log('🎯 Debug - Generated title:', challengeData.title);

      // Set scheduling
      let scheduledDate = null;
      if (scheduleFor) {
        scheduledDate = new Date(scheduleFor);
        scheduledDate.setHours(0, 0, 0, 0);
      }

      console.log('📅 Debug - Saving to database...');
      // Create in database
      const challenge = await this.generator.createChallengeInDatabase(
        challengeData, 
        scheduledDate
      );

      console.log('✅ Debug - Challenge saved successfully');
      console.log('📊 Debug - Saved challenge ID:', challenge._id);
      
      // Create informative message with date information
      const challengeDate = challenge.date.toDateString();
      const today = new Date().toDateString();
      const isToday = challengeDate === today;
      const isTomorrow = new Date(Date.now() + 86400000).toDateString() === challengeDate;
      
      let message = '';
      if (isToday) {
        message = `Challenge created and activated for today (${challengeDate})`;
      } else if (isTomorrow) {
        message = `Challenge scheduled for tomorrow (${challengeDate})`;
      } else {
        message = `Challenge scheduled for ${challengeDate}`;
      }

      res.status(201).json({
        success: true,
        message: message,
        data: challenge
      });
    } catch (error) {
      console.error('🚨 Debug - Error in generateAndCreateChallenge:', error);
      console.error('🚨 Debug - Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to generate and create challenge',
        error: error.message
      });
    }
  }

  // Generate weekly challenges
  async generateWeeklyChallenges(req, res) {
    try {
      console.log('🗓️ Debug - Starting weekly challenges generation...');
      const { startDate, difficulties } = req.body;
      
      console.log('📅 Debug - Weekly options:', { startDate, difficulties });
      
      // Generate challenges for the week
      const start = new Date(startDate || Date.now());
      console.log('📅 Debug - Start date:', start.toDateString());
      
      console.log('🚀 Debug - Calling generator.generateWeeklyChallenges...');
      const challenges = await this.generator.generateWeeklyChallenges(start, difficulties || ['Easy', 'Medium', 'Hard']);
      
      console.log(`✅ Debug - Generated ${challenges.length} challenges for the week`);
      console.log('📊 Debug - Challenges:', challenges.map(c => ({ title: c.title, date: c.date.toDateString() })));
      
      res.status(201).json({
        success: true,
        message: `Generated ${challenges.length} weekly challenges`,
        data: challenges
      });
    } catch (error) {
      console.error('🚨 Debug - Error in generateWeeklyChallenges:', error);
      console.error('🚨 Debug - Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to generate weekly challenges',
        error: error.message
      });
    }
  }

  // Auto-generate challenges for next N days
  async autoGenerateChallenges(req, res) {
    try {
      const { daysAhead = 7 } = req.body;
      
      const challenges = await this.generator.autoGenerateChallenges(daysAhead);

      res.status(201).json({
        success: true,
        message: `Auto-generated ${challenges.length} challenges for the next ${daysAhead} days`,
        data: challenges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to auto-generate challenges',
        error: error.message
      });
    }
  }

  // Generate topic-specific challenge
  async generateTopicChallenge(req, res) {
    try {
      const { topic, difficulty } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required'
        });
      }

      const challengeData = await this.generator.generateDailyChallenge({
        topic,
        difficulty: difficulty || 'Medium',
        category: 'Algorithms',
        timeLimit: 30,
        maxPoints: 100
      });

      res.status(200).json({
        success: true,
        message: `Topic-specific challenge generated for: ${topic}`,
        data: challengeData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate topic challenge',
        error: error.message
      });
    }
  }

  // Preview challenge before saving
  async previewChallenge(req, res) {
    try {
      const { difficulty, category, timeLimit, maxPoints, topic } = req.body;
      
      const challengeData = await this.generator.generateDailyChallenge({
        topic,
        difficulty: difficulty || 'Medium',
        category: category || 'Algorithms',
        timeLimit: timeLimit || 30,
        maxPoints: maxPoints || 100
      });

      res.status(200).json({
        success: true,
        message: 'Challenge preview generated',
        data: {
          ...challengeData,
          isPreview: true,
          previewGeneratedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview',
        error: error.message
      });
    }
  }

  // Get challenge generation statistics
  async getGenerationStats(req, res) {
    try {
      console.log('📊 Debug - Getting generation stats...');
      
      // Get total challenges
      const totalChallenges = await DailyChallenge.countDocuments();
      console.log('📊 Debug - Total challenges:', totalChallenges);
      
      // Get category distribution
      const categoryStats = await DailyChallenge.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Get difficulty distribution
      const difficultyStats = await DailyChallenge.aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Calculate most used category and difficulty
      const mostUsedCategory = categoryStats.length > 0 ? categoryStats[0]._id : 'N/A';
      const mostUsedDifficulty = difficultyStats.length > 0 ? difficultyStats[0]._id : 'N/A';
      
      // Calculate success rate (mock for now - always 100% since we only save successful ones)
      const successRate = totalChallenges > 0 ? 100 : 0;
      
      // Calculate average generation time (mock for now)
      const avgGenerationTime = 2.3; // seconds
      
      console.log('📊 Debug - Stats calculated:', {
        totalChallenges,
        successRate,
        avgGenerationTime,
        mostUsedCategory,
        mostUsedDifficulty
      });

      console.log('📊 Debug - About to send stats response:', {
        success: true,
        data: {
          totalGenerated: totalChallenges,
          successRate,
          avgGenerationTime,
          mostUsedCategory,
          mostUsedDifficulty
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalGenerated: totalChallenges,
          successRate,
          avgGenerationTime,
          mostUsedCategory,
          mostUsedDifficulty
        }
      });
    } catch (error) {
      console.error('🚨 Debug - Error getting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get generation statistics',
        error: error.message
      });
    }
  }

  // Get all challenges for admin
  async getAllChallenges(req, res) {
    try {
      console.log('📊 Debug - Getting all challenges for admin...');
      
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
        .skip((page - 1) * limit);

      const total = await DailyChallenge.countDocuments(query);

      // Convert Mongoose documents to plain objects to avoid circular references
      const challengesData = challenges.map(challenge => challenge.toObject());

      console.log('📊 Debug - Found challenges:', challengesData.length);

      console.log('📊 Debug - About to send challenges response:', {
        success: true,
        data: {
          challenges: challengesData,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total: total
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          challenges: challengesData,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total: total
          }
        }
      });
    } catch (error) {
      console.error('🚨 Debug - Error getting all challenges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get challenges',
        error: error.message
      });
    }
  }

  // Get available dates for challenge scheduling
  async getAvailableDates(req, res) {
    try {
      console.log('📅 Debug - Getting available dates...');
      
      const { daysAhead = 30 } = req.query;
      
      // Get all existing challenges in the date range
      const existingChallenges = await DailyChallenge.find({
        date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + (parseInt(daysAhead) * 24 * 60 * 60 * 1000))
        }
      }).select('date').sort({ date: 1 });
      
      // Create set of existing dates
      const existingDateSet = new Set(
        existingChallenges.map(c => c.date.toISOString().split('T')[0])
      );
      
      // Generate all dates in range and mark availability
      const availableDates = [];
      const today = new Date();
      
      for (let i = 0; i < parseInt(daysAhead); i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);
        
        const dateStr = checkDate.toISOString().split('T')[0];
        const isAvailable = !existingDateSet.has(dateStr);
        
        availableDates.push({
          date: checkDate,
          dateStr: dateStr,
          isAvailable: isAvailable,
          dayName: checkDate.toLocaleDateString('en-US', { weekday: 'short' }),
          month: checkDate.toLocaleDateString('en-US', { month: 'short' }),
          day: checkDate.getDate()
        });
      }
      
      console.log(`📊 Debug - Found ${availableDates.filter(d => d.isAvailable).length} available dates out of ${daysAhead}`);
      
      res.status(200).json({
        success: true,
        data: {
          availableDates,
          totalAvailable: availableDates.filter(d => d.isAvailable).length,
          totalDates: availableDates.length
        }
      });
    } catch (error) {
      console.error('🚨 Debug - Error getting available dates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available dates',
        error: error.message
      });
    }
  }

  // Get weekly schedule with advanced features
  async getWeeklySchedule(req, res) {
    try {
      console.log('📅 Debug - Getting weekly schedule...');
      const { startDate } = req.query;
      
      const schedule = await this.generator.getWeeklySchedule(
        new Date(startDate || Date.now())
      );
      
      res.status(200).json({
        success: true,
        message: 'Weekly schedule retrieved successfully',
        data: schedule
      });
    } catch (error) {
      console.error('🚨 Debug - Error getting weekly schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get weekly schedule',
        error: error.message
      });
    }
  }

  // Get monthly schedule with calendar view
  async getMonthlySchedule(req, res) {
    try {
      console.log('📅 Debug - Getting monthly schedule...');
      const { monthYear } = req.query;
      
      if (!monthYear) {
        return res.status(400).json({
          success: false,
          message: 'monthYear parameter is required (format: YYYY-MM)'
        });
      }
      
      // Parse monthYear (e.g., "2026-02")
      const [year, month] = monthYear.split('-').map(Number);
      const targetDate = new Date(year, month - 1, 1); // month is 0-indexed in JS
      
      console.log('📅 Debug - Target date:', { year, month, targetDate: targetDate.toISOString() });
      
      // Get all challenges for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      
      console.log('📅 Debug - Date range:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      
      const challenges = await DailyChallenge.find({
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      }).sort({ date: 1 });
      
      console.log('📅 Debug - Found challenges:', challenges.length);
      
      // Create calendar days
      const calendarDays = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
      const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
      
      // Add empty days for alignment
      for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push({
          day: '',
          isReserved: false,
          isPadding: true
        });
      }
      
      // Add actual days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const challenge = challenges.find(c => c.date === dateStr);
        
        calendarDays.push({
          day,
          date: dateStr,
          isReserved: !!challenge,
          challenge: challenge ? {
            title: challenge.title,
            difficulty: challenge.difficulty,
            category: challenge.category
          } : null
        });
      }
      
      const reservedCount = challenges.length;
      const availableCount = daysInMonth - reservedCount;
      
      const monthlySchedule = {
        month: month,
        year: year,
        monthName: targetDate.toLocaleDateString('en-US', { month: 'long' }),
        calendarDays,
        reservedCount,
        availableCount,
        totalDays: daysInMonth,
        challenges: challenges.map(c => ({
          date: c.date,
          title: c.title,
          difficulty: c.difficulty,
          category: c.category,
          isActive: c.isActive
        }))
      };
      
      console.log('📅 Debug - Monthly schedule created:', {
        month: monthlySchedule.monthName,
        year: monthlySchedule.year,
        reservedCount: monthlySchedule.reservedCount,
        availableCount: monthlySchedule.availableCount
      });
      
      res.status(200).json({
        success: true,
        message: 'Monthly schedule retrieved successfully',
        data: monthlySchedule
      });
    } catch (error) {
      console.error('🚨 Debug - Error getting monthly schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly schedule',
        error: error.message
      });
    }
  }

  // Bulk register challenges with preferences
  async bulkRegisterChallenges(req, res) {
    try {
      console.log('🚀 Debug - Starting bulk registration...');
      const { startDate, preferences } = req.body;
      
      console.log('📅 Debug - Bulk registration options:', { startDate, preferences });
      
      const result = await this.generator.bulkRegisterChallenges(
        new Date(startDate || Date.now()),
        preferences
      );
      
      res.status(200).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('🚨 Debug - Error in bulk registration:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk registration failed',
        error: error.message
      });
    }
  }

  async bulkGenerate(req, res) {
    try {
      console.log('🚀 Debug - Starting bulk generation...');
      const { startDate, endDate, difficulty, category } = req.body;
      
      console.log('📅 Debug - Date range:', { startDate, endDate, difficulty, category });
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      console.log(`📊 Debug - Generating ${days} challenges...`);
      
      const challenges = [];
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const categories = ['Algorithms', 'Data Structures', 'Strings', 'Arrays', 'Trees', 'Dynamic Programming', 'Graphs', 'Recursion'];
      
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(start);
        targetDate.setDate(targetDate.getDate() + i);
        targetDate.setHours(0, 0, 0, 0);
        
        console.log(`📅 Debug - Day ${i + 1}: ${targetDate.toDateString()}`);
        
        try {
          const challengeData = await this.generator.generateDailyChallenge({
            difficulty: difficulty || difficulties[i % difficulties.length],
            category: category || categories[i % categories.length],
            timeLimit: 30,
            maxPoints: 100
          });
          
          console.log(`✅ Debug - Generated challenge: ${challengeData.title}`);
          
          const savedChallenge = await this.generator.createChallengeInDatabase(challengeData, targetDate);
          challenges.push(savedChallenge);
          
          console.log(`💾 Debug - Saved challenge for ${targetDate.toDateString()}`);
          
        } catch (error) {
          console.error(`❌ Debug - Failed to generate challenge for day ${i + 1}:`, error.message);
          // Continue with next day instead of failing completely
        }
      }
      
      console.log(`🎉 Debug - Bulk generation complete: ${challenges.length}/${days} challenges created`);
      
      res.status(200).json({
        success: true,
        message: `Successfully generated ${challenges.length} challenges out of ${days} requested days`,
        data: {
          challenges,
          totalRequested: days,
          totalCreated: challenges.length,
          successRate: Math.round((challenges.length / days) * 100)
        }
      });
    } catch (error) {
      console.error('🚨 Debug - Error in bulkGenerate:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk generation failed',
        error: error.message
      });
    }
  }
}

module.exports = new AdminChallengeController();
