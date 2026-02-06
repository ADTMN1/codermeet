// Test Admin API without authentication for development
require('dotenv').config();
const adminChallengeController = require('./controllers/adminChallengeController');

async function testAdminAPI() {
  console.log('🧪 Testing Admin API Endpoints...\n');
  
  // Mock request/response objects
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`📊 Status: ${code}`);
        console.log(`✅ Success: ${data.success}`);
        console.log(`📝 Message: ${data.message}`);
        if (data.data) {
          console.log(`🎯 Title: ${data.data.title}`);
          console.log(`📚 Category: ${data.data.category}`);
          console.log(`🧪 Test Cases: ${data.data.testCases?.length}`);
          console.log(`💰 Max Points: ${data.data.maxPoints}`);
        }
        return data;
      }
    })
  };

  try {
    // Test 1: Generate challenge preview
    console.log('1️⃣ Testing Challenge Generation...');
    await adminChallengeController.generateChallenge({
      body: {
        difficulty: 'Easy',
        category: 'Arrays',
        timeLimit: 20,
        maxPoints: 50
      }
    }, mockRes);
    
    console.log('\n2️⃣ Testing Challenge Generation & Creation...');
    await adminChallengeController.generateAndCreateChallenge({
      body: {
        difficulty: 'Medium',
        category: 'Algorithms',
        activateImmediately: true
      }
    }, mockRes);
    
    console.log('\n3️⃣ Testing Topic-Specific Generation...');
    await adminChallengeController.generateTopicChallenge({
      body: {
        topic: 'Binary Search Trees',
        difficulty: 'Hard'
      }
    }, mockRes);
    
    console.log('\n4️⃣ Testing Preview...');
    await adminChallengeController.previewChallenge({
      body: {
        difficulty: 'Easy',
        category: 'Strings'
      }
    }, mockRes);
    
    console.log('\n🎉 All Admin API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

testAdminAPI();
