const mongoose = require('mongoose');
const Competition = require('../models/competition');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codermeet');

const seedCompetition = async () => {
  try {
    // Find an admin user or create a default one
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a default admin user if none exists
      adminUser = new User({
        fullName: 'System Admin',
        username: 'admin',
        email: 'admin@codermeet.com',
        password: 'admin123', // Change this in production
        role: 'admin',
        plan: 'Premium'
      });
      await adminUser.save();
    }

    // Check if competition already exists
    const existingCompetition = await Competition.findOne({ 
      title: 'Business Idea Competition 2025' 
    });

    if (existingCompetition) {
      console.log('Competition already exists');
      return;
    }

    // Create new competition
    const competition = new Competition({
      title: 'Business Idea Competition 2025',
      description: 'Submit your innovative startup idea and win amazing prizes',
      deadline: new Date('2025-03-31T23:59:59.999Z'),
      prize: '5000 Birr + Mentorship',
      rules: [
        'Must be an original business idea',
        'Should solve a real problem',
        'Must include a viable business model',
        'Open to all registered users',
        'Ideas will be judged on innovation and feasibility'
      ],
      isActive: true,
      maxSubmissions: null,
      createdBy: adminUser._id
    });

    await competition.save();
    console.log('Competition seeded successfully!');
    console.log('Competition details:', {
      title: competition.title,
      deadline: competition.deadline,
      prize: competition.prize
    });

  } catch (error) {
    console.error('Error seeding competition:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedCompetition();
