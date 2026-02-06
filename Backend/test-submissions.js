const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    const Submission = require('./models/submission');
    
    // Check what user ID we're looking for
    const targetUserId = '6957ad5161015aa2d862aa3b';
    console.log('Looking for submissions with user ID:', targetUserId);
    
    // Create test submissions with the correct user ID
    const testSubmissions = [
      {
        userId: targetUserId,
        challengeType: 'weekly',
        title: 'Real-Time Chat Application',
        description: 'A full-stack real-time chat application built with React, Node.js, and Socket.io',
        githubUrl: 'https://github.com/demo/chat-app',
        technologies: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
        status: 'completed',
        score: 85,
        feedback: 'Excellent implementation of real-time features!',
        featured: true
      },
      {
        userId: targetUserId,
        challengeType: 'daily',
        title: 'REST API Task Manager',
        description: 'A RESTful API for task management with CRUD operations',
        githubUrl: 'https://github.com/demo/task-api',
        technologies: ['Node.js', 'Express', 'MongoDB', 'JWT'],
        status: 'completed',
        score: 78,
        feedback: 'Good implementation with proper error handling.'
      },
      {
        userId: targetUserId,
        challengeType: 'business-competition',
        title: 'AI Business Idea Platform',
        description: 'An AI-powered platform for generating business ideas',
        githubUrl: 'https://github.com/demo/ai-business',
        technologies: ['Next.js', 'OpenAI API', 'PostgreSQL'],
        status: 'completed',
        score: 95,
        feedback: 'Innovative use of AI technologies!'
      }
    ];
    
    // Insert test submissions
    Submission.insertMany(testSubmissions)
      .then(() => {
        console.log('Test submissions created for user:', targetUserId);
        
        // Verify the submissions were created
        return Submission.find({ userId: targetUserId })
          .then(userSubmissions => {
            console.log('User submissions found:', userSubmissions.length);
            userSubmissions.forEach((sub, index) => {
              console.log(`${index + 1}. Title: ${sub.title}, Type: ${sub.challengeType}, Status: ${sub.status}`);
            });
            process.exit(0);
          })
          .catch(err => console.error('Error verifying submissions:', err));
      })
      .catch(err => console.error('Error creating test submissions:', err));
  })
  .catch(err => console.error('MongoDB connection error:', err));
