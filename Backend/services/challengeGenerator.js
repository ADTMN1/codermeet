const Groq = require('groq-sdk');

class ChallengeGenerator {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // Build challenge prompt for AI
  buildChallengePrompt(difficulty, category, timeLimit, maxPoints, topic = null) {
    const basePrompt = `Generate a coding challenge with the following specifications:

Difficulty: ${difficulty}
Category: ${category}
Time Limit: ${timeLimit} minutes
Max Points: ${maxPoints}
${topic ? `Specific Topic: ${topic}` : ''}

Requirements:
1. Create a solvable, well-defined problem
2. Provide clear description and constraints
3. Include 3-5 test cases with inputs and expected outputs
4. Ensure the solution can be written within the time limit
5. Make it appropriate for the difficulty level

Return the response in this exact JSON format:
{
  "title": "Challenge Title",
  "description": "Clear problem description",
  "difficulty": "${difficulty}",
  "category": "${category}",
  "timeLimit": ${timeLimit},
  "maxPoints": ${maxPoints},
  "hint": "Helpful hint for solving",
  "examples": [
    {
      "input": "example input",
      "output": "example output",
      "explanation": "brief explanation"
    }
  ],
  "constraints": [
    "constraint 1",
    "constraint 2"
  ],
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output",
      "weight": 1
    }
  ],
  "scoringCriteria": {
    "correctness": {
      "weight": 0.6,
      "description": "All test cases pass correctly"
    },
    "speed": {
      "weight": 0.2,
      "description": "Efficient time complexity implementation"
    },
    "efficiency": {
      "weight": 0.2,
      "description": "Optimal space complexity"
    }
  },
  "prizes": [
    {
      "rank": 1,
      "points": ${maxPoints},
      "description": "First place prize"
    }
  ],
  "tags": ["${category.toLowerCase()}", "${difficulty.toLowerCase()}"],
  "solutionApproach": "Brief approach to solve the problem"
}`;

    return basePrompt;
  }

  // Generate daily challenge using AI (OPTIMIZED)
  async generateDailyChallenge(options = {}) {
    const startTime = Date.now();
    console.log('🚀 Starting AI challenge generation...');
    
    try {
      const {
        difficulty = 'Medium',
        category = 'Algorithms',
        timeLimit = 30,
        maxPoints = 100,
        topic = null
      } = options;

      // Build prompt
      const prompt = this.buildChallengePrompt(difficulty, category, timeLimit, maxPoints, topic);
      
      console.log('📝 Calling Groq API...');
      const apiStartTime = Date.now();
      
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert coding challenge creator. Generate challenges that are solvable, well-tested, and follow best practices. Keep responses concise and structured."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500, // Reduced for faster response
        temperature: 0.7,
        stream: false
      });

      const apiEndTime = Date.now();
      console.log(`⚡ Groq API took ${apiEndTime - apiStartTime}ms`);

      const content = response.choices[0].message.content;
      console.log('📊 Parsing AI response...');
      
      const parseStartTime = Date.now();
      const challengeData = this.parseChallengeResponse(content, difficulty, category, timeLimit, maxPoints);
      
      const parseEndTime = Date.now();
      console.log(`⚡ Parsing took ${parseEndTime - parseStartTime}ms`);
      
      const totalTime = Date.now() - startTime;
      console.log(`🎯 Total generation time: ${totalTime}ms`);
      
      return challengeData;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Generation failed after ${totalTime}ms:`, error.message);
      throw new Error(`Failed to generate challenge: ${error.message}`);
    }
  }

  // Parse AI response and extract challenge data
  parseChallengeResponse(content, difficulty, category, timeLimit, maxPoints) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const challengeData = JSON.parse(jsonMatch[0]);
      
      // Ensure required fields
      challengeData.difficulty = difficulty;
      challengeData.category = category;
      challengeData.timeLimit = timeLimit;
      challengeData.maxPoints = maxPoints;
      
      // Ensure arrays exist
      challengeData.testCases = challengeData.testCases || [];
      challengeData.examples = challengeData.examples || [];
      challengeData.constraints = challengeData.constraints || [];
      challengeData.tags = challengeData.tags || [];
      challengeData.prizes = challengeData.prizes || [];
      
      // Ensure scoring criteria
      challengeData.scoringCriteria = {
        correctness: {
          weight: challengeData.scoringCriteria?.correctness?.weight || 0.6,
          description: challengeData.scoringCriteria?.correctness?.description || 'All test cases pass correctly'
        },
        speed: {
          weight: challengeData.scoringCriteria?.speed?.weight || 0.2,
          description: challengeData.scoringCriteria?.speed?.description || 'Efficient time complexity implementation'
        },
        efficiency: {
          weight: challengeData.scoringCriteria?.efficiency?.weight || 0.2,
          description: challengeData.scoringCriteria?.efficiency?.description || 'Optimal space complexity'
        }
      };
      
      return challengeData;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', content);
      
      // Return fallback challenge data
      return {
        title: "Algorithm Challenge",
        description: "Solve this algorithmic problem efficiently.",
        difficulty,
        category,
        timeLimit,
        maxPoints,
        hint: "Think about the optimal approach",
        examples: [
          {
            input: "sample input",
            output: "sample output",
            explanation: "Sample explanation"
          }
        ],
        constraints: [
          "Time complexity should be optimal",
          "Handle edge cases"
        ],
        testCases: [
          {
            input: "test input",
            expectedOutput: "test output",
            weight: 1
          }
        ],
        scoringCriteria: {
          correctness: { weight: 0.6, description: "All test cases pass correctly" },
          speed: { weight: 0.2, description: "Efficient time complexity implementation" },
          efficiency: { weight: 0.2, description: "Optimal space complexity" }
        },
        prizes: [
          {
            rank: 1,
            points: maxPoints,
            description: "First place prize"
          }
        ],
        tags: [category.toLowerCase(), difficulty.toLowerCase()],
        solutionApproach: "Use an efficient algorithm to solve this problem"
      };
    }
  }

  // Create challenge in database (OPTIMIZED)
  async createChallengeInDatabase(challengeData, scheduledDate = null) {
    try {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI || process.env.MONGO_URI);
      
      await client.connect();
      const db = client.db('codermeet');
      const collection = db.collection('dailychallenges');
      
      // If no specific date provided, schedule for tomorrow to avoid conflicts
      let date = scheduledDate || new Date();
      if (!scheduledDate) {
        date = new Date();
        date.setDate(date.getDate() + 1); // Schedule for tomorrow
      }
      date.setHours(0, 0, 0, 0); // Set to start of day
      
      console.log(`📅 Scheduling challenge for ${date.toDateString()}`);
      
      // Check if challenge already exists for this date
      const existing = await collection.findOne({ date });
      
      // Find next available date efficiently
      let availableDate = date;
      
      if (existing) {
        console.log(`⚠️ Challenge already exists for ${date.toDateString()}: ${existing.title}`);
        
        // Find all existing dates in one query and calculate next available
        const existingDates = await collection.aggregate([
          { $match: { date: { $gte: new Date() } } },
          { $project: { date: 1, _id: 0 } },
          { $sort: { date: 1 } }
        ]).toArray();
        
        const existingDateSet = new Set(existingDates.map(d => d.date.toISOString().split('T')[0]));
        
        // Find next available date (check up to 30 days ahead)
        let attempts = 0;
        let found = false;
        
        while (attempts < 30 && !found) {
          const checkDate = new Date(date);
          checkDate.setDate(date.getDate() + attempts);
          checkDate.setHours(0, 0, 0, 0);
          
          const dateStr = checkDate.toISOString().split('T')[0];
          if (!existingDateSet.has(dateStr)) {
            availableDate = checkDate;
            found = true;
            console.log(`✅ Found available date: ${availableDate.toDateString()}`);
            break;
          }
          attempts++;
        }
        
        if (!found) {
          console.log(`❌ No available dates found in next 30 days, returning existing challenge`);
          await client.close();
          return existing;
        }
      }
      
      // Create challenge document
      const challengeDoc = {
        date: availableDate,
        title: challengeData.title,
        description: challengeData.description,
        difficulty: challengeData.difficulty,
        category: challengeData.category,
        timeLimit: challengeData.timeLimit,
        maxPoints: challengeData.maxPoints,
        hint: challengeData.hint,
        examples: challengeData.examples,
        constraints: challengeData.constraints,
        testCases: challengeData.testCases,
        scoringCriteria: challengeData.scoringCriteria,
        prizes: challengeData.prizes,
        tags: challengeData.tags,
        solutionApproach: challengeData.solutionApproach,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(challengeDoc);
      console.log(`✅ Saved challenge: ${challengeData.title} for ${availableDate.toDateString()}`);
      console.log(`📊 Inserted ID: ${result.insertedId}`);
      
      // Return with _id
      const savedChallenge = {
        ...challengeDoc,
        _id: result.insertedId
      };
      
      console.log(`📊 Returning saved challenge:`, savedChallenge.title, savedChallenge.date.toDateString());
      
      await client.close();
      return savedChallenge;
    } catch (error) {
      console.error('Database Creation Error:', error);
      throw new Error(`Failed to save challenge: ${error.message}`);
    }
  }

  // Get weekly schedule with advanced features
  async getWeeklySchedule(startDate, preferences = {}) {
    try {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI || process.env.MONGO_URI);
      
      await client.connect();
      const db = client.db('codermeet');
      const collection = db.collection('dailychallenges');
      
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      
      // Get challenges for the week
      const weeklyChallenges = await collection.find({
        date: { $gte: start, $lt: end }
      }).sort({ date: 1 }).toArray();
      
      // Get all available dates for the week
      const availableDates = [];
      const reservedDates = [];
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);
        
        const hasChallenge = weeklyChallenges.some(c => 
          c.date.toDateString() === checkDate.toDateString()
        );
        
        const dateInfo = {
          date: checkDate,
          dateStr: checkDate.toISOString().split('T')[0],
          dayName: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
          month: checkDate.toLocaleDateString('en-US', { month: 'short' }),
          day: checkDate.getDate(),
          isReserved: hasChallenge,
          challenge: hasChallenge ? weeklyChallenges.find(c => 
            c.date.toDateString() === checkDate.toDateString()
          ) : null
        };
        
        if (hasChallenge) {
          reservedDates.push(dateInfo);
        } else {
          availableDates.push(dateInfo);
        }
      }
      
      await client.close();
      
      return {
        weekStart: start,
        weekEnd: end,
        totalDays: 7,
        reservedDates,
        availableDates,
        reservedCount: reservedDates.length,
        availableCount: availableDates.length,
        isFullyBooked: availableDates.length === 0,
        needsAttention: availableDates.length > 3, // More than 3 days available
        weeklyChallenges
      };
    } catch (error) {
      console.error('Error getting weekly schedule:', error);
      throw new Error(`Failed to get weekly schedule: ${error.message}`);
    }
  }

  // Bulk register challenges with preferences
  async bulkRegisterChallenges(startDate, preferences = {}) {
    try {
      const { 
        difficulties = ['Easy', 'Medium', 'Hard'],
        categories = ['Algorithms', 'Data Structures', 'Strings', 'Arrays', 'Trees'],
        timeLimit = 30,
        maxPoints = 100,
        skipReserved = true,
        notifyOnSkip = true
      } = preferences;
      
      const weeklySchedule = await this.getWeeklySchedule(startDate, preferences);
      
      if (weeklySchedule.isFullyBooked) {
        return {
          success: false,
          message: 'Week is fully booked. No available dates.',
          schedule: weeklySchedule
        };
      }
      
      const registeredChallenges = [];
      const skippedDates = [];
      const notifications = [];
      
      for (const availableDate of weeklySchedule.availableDates) {
        try {
          const challengeData = await this.generateDailyChallenge({
            difficulty: difficulties[registeredChallenges.length % difficulties.length],
            category: categories[registeredChallenges.length % categories.length],
            timeLimit,
            maxPoints
          });
          
          const savedChallenge = await this.createChallengeInDatabase(challengeData, availableDate.date);
          registeredChallenges.push(savedChallenge);
          
          notifications.push({
            type: 'success',
            message: `Challenge registered for ${availableDate.dayName}, ${availableDate.month} ${availableDate.day}`,
            date: availableDate.date,
            challenge: savedChallenge.title
          });
          
        } catch (error) {
          console.error(`Failed to register challenge for ${availableDate.date}:`, error);
          skippedDates.push({
            date: availableDate.date,
            reason: error.message,
            dateInfo: availableDate
          });
          
          if (notifyOnSkip) {
            notifications.push({
              type: 'warning',
              message: `Failed to register challenge for ${availableDate.dayName}: ${error.message}`,
              date: availableDate.date,
              error: error.message
            });
          }
        }
      }
      
      // Check if next week needs attention
      const nextWeek = new Date(startDate);
      nextWeek.setDate(startDate.getDate() + 7);
      const nextWeekSchedule = await this.getWeeklySchedule(nextWeek);
      
      if (nextWeekSchedule.availableCount > 3) {
        notifications.push({
          type: 'alert',
          message: `Next week has ${nextWeekSchedule.availableCount} available dates. Consider scheduling challenges.`,
          week: 'next',
          availableCount: nextWeekSchedule.availableCount
        });
      }
      
      return {
        success: true,
        message: `Successfully registered ${registeredChallenges.length} challenges`,
        registeredChallenges,
        skippedDates,
        notifications,
        schedule: weeklySchedule,
        nextWeekSchedule
      };
    } catch (error) {
      console.error('Error in bulk registration:', error);
      throw new Error(`Failed bulk registration: ${error.message}`);
    }
  }

  // Generate weekly challenges
  async generateWeeklyChallenges(startDate, difficulties = ['Easy', 'Medium', 'Hard']) {
    try {
      console.log('🗓️ Debug - Service: Starting weekly challenges generation...');
      console.log('📅 Debug - Service: Start date:', startDate.toDateString());
      console.log('🎯 Debug - Service: Difficulties:', difficulties);
      
      const challenges = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        console.log(`📅 Debug - Service: Day ${i + 1}: ${date.toDateString()}`);
        
        const difficulty = difficulties[i % difficulties.length];
        console.log(`🎯 Debug - Service: Using difficulty: ${difficulty}`);
        
        try {
          console.log('🚀 Debug - Service: Generating daily challenge...');
          const challengeData = await this.generateDailyChallenge({
            difficulty,
            category: 'Mixed',
            timeLimit: 30,
            maxPoints: 100
          });
          
          console.log(`✅ Debug - Service: Generated challenge: ${challengeData.title}`);
          
          console.log('💾 Debug - Service: Saving challenge to database...');
          const savedChallenge = await this.createChallengeInDatabase(challengeData, date);
          challenges.push(savedChallenge);
          
          console.log(`💾 Debug - Service: Saved challenge for ${date.toDateString()}`);
          
        } catch (error) {
          console.error(`❌ Debug - Service: Failed to generate challenge for day ${i + 1}:`, error.message);
          console.error(`❌ Debug - Service: Error stack:`, error.stack);
          // Continue with next day instead of failing completely
        }
      }
      
      console.log(`🎉 Debug - Service: Weekly generation complete: ${challenges.length}/7 challenges created`);
      return challenges;
      
    } catch (error) {
      console.error('🚨 Debug - Service: Error in generateWeeklyChallenges:', error);
      console.error('🚨 Debug - Service: Error stack:', error.stack);
      throw error;
    }
  }

  // Auto-generate challenges for next N days
  async autoGenerateChallenges(daysAhead = 7) {
    const challenges = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const challengeData = await this.generateDailyChallenge({
        difficulty: 'Medium',
        category: 'Algorithms',
        timeLimit: 30,
        maxPoints: 100
      });
      
      const savedChallenge = await this.createChallengeInDatabase(challengeData, date);
      challenges.push(savedChallenge);
    }
    
    return challenges;
  }

  // Generate topic-specific challenge
  async generateTopicChallenge(topic, options = {}) {
    const challengeData = await this.generateDailyChallenge({
      ...options,
      topic
    });
    
    return await this.createChallengeInDatabase(challengeData);
  }

  // Bulk generate challenges
  async bulkGenerate(startDate, endDate, options = {}) {
    const challenges = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      const challengeData = await this.generateDailyChallenge(options);
      const savedChallenge = await this.createChallengeInDatabase(challengeData, date);
      challenges.push(savedChallenge);
    }
    
    return challenges;
  }
}

module.exports = ChallengeGenerator;
