const mongoose = require('mongoose');
require('dotenv').config();

const WeeklyChallenge = require('./models/weeklyChallenge');

const fixChallengeDeadline = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Find the Week 1 challenge that has wrong deadline
    const challenge = await WeeklyChallenge.findOne({ weekNumber: 1, year: 2026 });
    
    if (!challenge) {
      console.log('❌ Week 1 challenge not found');
      return;
    }
    
    console.log('🔍 Current challenge details:');
    console.log('   Title:', challenge.title);
    console.log('   Current endDate:', challenge.endDate.toISOString());
    console.log('   Status:', challenge.status);
    
    // Fix the endDate to 23:59:59 UTC today
    const today = new Date();
    const fixedEndDate = new Date(today);
    fixedEndDate.setUTCHours(23, 59, 59, 999);
    
    console.log('🔧 Fixing endDate to:', fixedEndDate.toISOString());
    
    // Update the challenge
    await WeeklyChallenge.updateOne(
      { _id: challenge._id },
      { 
        endDate: fixedEndDate,
        status: 'active' // Reset to active since deadline is now tonight
      }
    );
    
    console.log('✅ Challenge deadline fixed!');
    console.log('📊 New details:');
    console.log('   End Date:', fixedEndDate.toISOString());
    console.log('   Status: active');
    console.log('   Time until deadline:', (fixedEndDate - new Date()) / (1000 * 60 * 60), 'hours');
    
  } catch (error) {
    console.error('❌ Error fixing challenge:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the fix
fixChallengeDeadline();
