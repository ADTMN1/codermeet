const mongoose = require('mongoose');
require('dotenv').config();

// Load the WeeklyChallenge model
const WeeklyChallenge = require('./models/weeklyChallenge');

const checkWeeklyChallenges = async () => {
  try {
    // Connect to MongoDB Atlas using the same connection as the server
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get total count
    const totalCount = await WeeklyChallenge.countDocuments();
    console.log(`\n📊 Total weekly challenges in database: ${totalCount}`);
    
    if (totalCount > 0) {
      // Get all weekly challenges with basic info
      const challenges = await WeeklyChallenge.find({}, 
        'title weekNumber year status category difficulty startDate endDate'
      ).sort({ year: 1, weekNumber: 1 });
      
      console.log('\n📋 Weekly Challenges List:');
      console.log('━'.repeat(80));
      
      challenges.forEach((challenge, index) => {
        console.log(`${index + 1}. Week ${challenge.weekNumber} (${challenge.year})`);
        console.log(`   Title: ${challenge.title}`);
        console.log(`   Category: ${challenge.category} | Difficulty: ${challenge.difficulty}`);
        console.log(`   Status: ${challenge.status}`);
        console.log(`   Period: ${new Date(challenge.startDate).toLocaleDateString()} - ${new Date(challenge.endDate).toLocaleDateString()}`);
        console.log('─'.repeat(80));
      });
      
      // Count by status
      const statusCounts = await WeeklyChallenge.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📈 Challenges by Status:');
      statusCounts.forEach(item => {
        console.log(`   ${item._id}: ${item.count}`);
      });
      
      // Count by category
      const categoryCounts = await WeeklyChallenge.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n🏷️  Challenges by Category:');
      categoryCounts.forEach(item => {
        console.log(`   ${item._id}: ${item.count}`);
      });
      
    } else {
      console.log('❌ No weekly challenges found in the database');
      console.log('💡 You may need to create some weekly challenges first');
    }
    
  } catch (error) {
    console.error('❌ Error checking weekly challenges:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the check
checkWeeklyChallenges();
