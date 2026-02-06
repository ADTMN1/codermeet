// Test Groq API Connection
require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  try {
    console.log('🧪 Testing Groq API...');
    
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('❌ Please add your Groq API key to .env file');
      console.log('📝 Get your key from: https://console.groq.com/keys');
      return;
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    console.log('✅ Groq client initialized');
    
    // Test simple completion
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Generate a simple coding challenge title about arrays"
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 100
    });

    const response = completion.choices[0].message.content;
    console.log('🎉 Groq API Test Successful!');
    console.log('📝 Sample Response:', response);
    
    // Test challenge generation
    console.log('\n🚀 Testing challenge generation...');
    const ChallengeGenerator = require('./services/challengeGenerator');
    const generator = new ChallengeGenerator();
    
    const challenge = await generator.generateDailyChallenge({
      difficulty: 'Easy',
      category: 'Arrays'
    });
    
    console.log('✅ Challenge generated successfully!');
    console.log('📊 Title:', challenge.title);
    console.log('🎯 Difficulty:', challenge.difficulty);
    console.log('📝 Description length:', challenge.description.length);
    console.log('🧪 Test cases:', challenge.testCases.length);
    console.log('💰 Max points:', challenge.maxPoints);
    
  } catch (error) {
    console.error('❌ Groq API Test Failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('🔑 Invalid API key - please check your GROQ_API_KEY');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 Network error - please check your internet connection');
    } else {
      console.log('🐛 Unknown error:', error);
    }
  }
}

testGroq();
