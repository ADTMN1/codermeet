const Groq = require('groq-sdk');
const DailyChallenge = require('../models/dailyChallenge');

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

      const content = response.choices[0].message.content;
      
      const parseStartTime = Date.now();
      const challengeData = this.parseChallengeResponse(content, difficulty, category, timeLimit, maxPoints);
      
      const parseEndTime = Date.now();
      
      const totalTime = Date.now() - startTime;
      
      return challengeData;
    } catch (error) {
      const totalTime = Date.now() - startTime;
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
      throw new Error(`Failed to parse AI response: ${error.message}`);
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
      // Don't set hours - keep the date as-is since it's already at midnight UTC
      
      // Check if challenge already exists for this date
      const dateStr = date.toISOString().split('T')[0];
      const existing = await DailyChallenge.findOne({ date });
      
      // Find next available date efficiently
      let availableDate = date;
      
      if (existing) {
        console.log(`⚠️ Challenge already exists for ${date.toDateString()}: ${existing.title}`);
        
        // Find all existing dates in one query and calculate next available
        const existingDates = await DailyChallenge.find({
          date: { $gte: new Date() }
        }).select('date').sort({ date: 1 });
        
        const existingDateSet = new Set(existingDates.map(d => d.date.toISOString().split('T')[0]));
        
        // Find next available date (check up to 30 days ahead)
        let attempts = 0;
        let found = false;
        
        while (attempts < 30 && !found) {
          const checkDate = new Date(date);
          checkDate.setDate(date.getDate() + attempts);
          // Don't set hours - keep the date as-is since it's already at midnight UTC
          
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (!existingDateSet.has(dateStr)) {
            availableDate = checkDate;
            found = true;
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

      // Use Mongoose to save for consistency
      const savedChallenge = new DailyChallenge({
        ...challengeDoc,
        date: availableDate
      });
      
      const result = await savedChallenge.save();
      console.log(`✅ Saved challenge: ${challengeData.title} for ${availableDate.toDateString()}`);
      console.log(`📊 Inserted ID: ${result._id}`);
      
      console.log(`📊 Returning saved challenge:`, result.title, result.date.toDateString());
      
      await client.close();
      return result;
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
      return {
        success: false,
        error: error.message,
        weeklyChallenges: []
      };
    }
  }

  // Generate challenge for specific date
  async generateChallengeForDate(date, options = {}) {
    const {
      timeLimit = 30,
      maxPoints = 100,
      difficulties = ['Easy', 'Medium', 'Hard'],
      categories = ['Algorithms', 'Data Structures', 'Problem Solving']
    } = options;

    try {
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const challengeData = await this.generateChallenge(difficulty, category, timeLimit, maxPoints);
      
      if (challengeData.success) {
        const savedChallenge = await this.createChallengeInDatabase(challengeData.data, date);
        return savedChallenge;
      } else {
        throw new Error('Failed to generate challenge');
      }
    } catch (error) {
      throw new Error(`Failed to generate challenge for date: ${error.message}`);
    }
  }

  // Generate topic-specific challenge
  async generateTopicChallenge(topic, options = {}) {
    try {
      const challengeData = await this.generateDailyChallenge({
        ...options,
        topic
      });
      
      return await this.createChallengeInDatabase(challengeData);
    } catch (error) {
      throw new Error(`Failed to generate topic challenge: ${error.message}`);
    }
  }
}

module.exports = ChallengeGenerator;
