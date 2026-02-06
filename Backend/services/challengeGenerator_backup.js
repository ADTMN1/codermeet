// AI-Powered Daily Challenge Generator using Groq
const Groq = require('groq-sdk');
const DailyChallenge = require('../models/dailyChallenge');

class ChallengeGenerator {
  constructor() {
    // Initialize Groq (Free tier: 14,000 requests/day)
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // Generate complete daily challenge with Groq AI
  async generateDailyChallenge(options = {}) {
    const {
      difficulty = 'Medium',
      category = 'Algorithms',
      timeLimit = 30,
      maxPoints = 100
    } = options;

    try {
      const prompt = `
      You are an expert coding challenge creator. Generate a complete daily coding challenge with these specifications:
      
      DIFFICULTY: ${difficulty}
      CATEGORY: ${category}
      TIME LIMIT: ${timeLimit} minutes
      MAX POINTS: ${maxPoints}
      
      Please create a challenging but solvable problem that tests ${category} concepts at ${difficulty} level.
      
      Include:
      1. A clear, engaging problem statement with detailed description
      2. Specific input/output format specifications
      3. Multiple examples with clear explanations
      4. Important constraints and edge cases to consider
      5. 5 comprehensive test cases (including edge cases and boundary conditions)
      6. Helpful hint for solving approach
      7. Scoring criteria with weights
      8. Prize structure
      
      Respond in this exact JSON format:
      {
        "title": "Challenge Title",
        "description": "Detailed problem description with examples and requirements...",
        "difficulty": "${difficulty}",
        "category": "${category}",
        "timeLimit": ${timeLimit},
        "maxPoints": ${maxPoints},
        "hint": "Helpful hint for solving the problem...",
        "examples": [
          {
            "input": "example input format",
            "output": "example output format", 
            "explanation": "why this works and the reasoning"
          }
        ],
        "constraints": ["constraint1 with details", "constraint2 with details"],
        "testCases": [
          {
            "input": "specific test input",
            "expectedOutput": "exact expected output",
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
        max_tokens: 2000, // Reduced from default for faster response
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
        challengeData.scoringCriteria = {
          correctness: {
            weight: challengeData.scoringCriteria.correctness?.weight || 0.6,
            description: challengeData.scoringCriteria.correctness?.description || 'All test cases pass correctly'
          },
          speed: {
            weight: challengeData.scoringCriteria.speed?.weight || 0.2,
            description: challengeData.scoringCriteria.speed?.description || 'Efficient time complexity implementation'
          },
          efficiency: {
            weight: challengeData.scoringCriteria.efficiency?.weight || 0.2,
            description: challengeData.scoringCriteria.efficiency?.description || 'Optimal space complexity usage'
          }
        };
      }
      
      // Truncate very long descriptions to prevent database issues
      if (challengeData.description && challengeData.description.length > 2000) {
        challengeData.description = challengeData.description.substring(0, 2000) + '...';
      }
      
      // Validate required fields
      this.validateChallengeData(challengeData);
      
      console.log(`✅ Generated ${difficulty} challenge: ${challengeData.title}`);
      return challengeData;
    } catch (error) {
      console.error('Groq AI Challenge Generation Error:', error);
      throw new Error(`Failed to generate challenge: ${error.message}`);
    }
  }

  // Generate multiple challenges for the week
  async generateWeeklyChallenges(difficulties = ['Easy', 'Medium', 'Hard', 'Medium', 'Easy']) {
    const challenges = [];
    const categories = ['Algorithms', 'Data Structures', 'Strings', 'Arrays', 'Trees'];
    
    for (let i = 0; i < difficulties.length; i++) {
      const challenge = await this.generateDailyChallenge({
        difficulty: difficulties[i],
        category: categories[i % categories.length],
        timeLimit: difficulties[i] === 'Easy' ? 20 : difficulties[i] === 'Hard' ? 45 : 30,
        maxPoints: difficulties[i] === 'Easy' ? 50 : difficulties[i] === 'Hard' ? 150 : 100
      });
      
      challenges.push({
        ...challenge,
        scheduledDate: this.getDateForDay(i) // Schedule for specific day
      });
    }
    
    return challenges;
  }

  // Create challenge in database
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
      console.log(`📊 Challenge document:`, JSON.stringify(challengeDoc, null, 2));
      
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

  // Auto-generate and schedule challenges
  async autoGenerateChallenges(daysAhead = 7) {
    const challenges = [];
    
    for (let i = 0; i < daysAhead; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);
      
      // Check if challenge already exists for this date
      const existing = await DailyChallenge.findOne({ date: targetDate });
      if (existing) {
        console.log(`Challenge already exists for ${targetDate.toDateString()}`);
        continue;
      }
      
      // Vary difficulty throughout the week
      const difficulty = this.getDifficultyForDay(i);
      const category = this.getCategoryForDay(i);
      
      try {
        const challengeData = await this.generateDailyChallenge({
          difficulty,
          category,
          timeLimit: difficulty === 'Easy' ? 20 : difficulty === 'Hard' ? 45 : 30,
          maxPoints: difficulty === 'Easy' ? 50 : difficulty === 'Hard' ? 150 : 100
        });
        
        const challenge = await this.createChallengeInDatabase(challengeData, targetDate);
        challenges.push(challenge);
        
        console.log(`✅ Generated ${difficulty} challenge for ${targetDate.toDateString()}: ${challenge.title}`);
      } catch (error) {
        console.error(`❌ Failed to generate challenge for ${targetDate.toDateString()}:`, error.message);
      }
    }
    
    return challenges;
  }

  // Generate challenge based on specific topic
  async generateTopicBasedChallenge(topic, difficulty = 'Medium') {
    const prompt = `
    Generate a coding challenge specifically about: ${topic}
    
    DIFFICULTY: ${difficulty}
    
    The challenge should test deep understanding of ${topic} concepts.
    Include edge cases specific to this topic.
    
    Use the same JSON format as before, but ensure the challenge is specifically about ${topic}.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to generate topic-specific challenge');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  // Helper methods
  validateChallengeData(data) {
    const required = ['title', 'description', 'examples', 'testCases', 'scoringCriteria'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!Array.isArray(data.testCases) || data.testCases.length < 3) {
      throw new Error('At least 3 test cases required');
    }
    
    if (!Array.isArray(data.examples) || data.examples.length < 1) {
      throw new Error('At least 1 example required');
    }
  }

  getDateForDay(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  getDifficultyForDay(dayIndex) {
    const difficulties = ['Easy', 'Medium', 'Hard', 'Medium', 'Easy', 'Medium', 'Hard'];
    return difficulties[dayIndex % difficulties.length];
  }

  getCategoryForDay(dayIndex) {
    const categories = [
      'Algorithms', 'Data Structures', 'Strings', 'Arrays', 
      'Trees', 'Dynamic Programming', 'Graphs'
    ];
    return categories[dayIndex % categories.length];
  }
}

module.exports = ChallengeGenerator;
