// socket/socketHandler.js
const Message = require('../models/message');
const Challenge = require('../models/challenge');
const User = require('../models/user');
const Notification = require('../models/notification');
const jwt = require('jsonwebtoken');
const chatServer = require('./chatServer');

// Authentication middleware for Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Handle both token formats - some use 'id', others use 'userId'
    socket.userId = decoded.id || decoded.userId;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = (io) => {
  // Initialize chat server
  chatServer(io);
  
  // Store online users per challenge
  const challengeUsers = new Map(); // challengeId -> Set of userIds

  // Function to broadcast live statistics
  const broadcastLiveStats = async (challengeId) => {
    try {
      // Get real-time statistics
      const [participants, teams, submissions] = await Promise.all([
        Challenge.findById(challengeId).populate('participants'),
        Challenge.findById(challengeId).populate('teams'),
        Challenge.findById(challengeId).populate('submissions')
      ]);

      const stats = {
        participants: participants?.participants?.length || 0,
        teams: participants?.teams?.length || 0,
        submissions: participants?.submissions?.length || 0,
        onlineUsers: challengeUsers.get(challengeId)?.size || 0,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users in challenge
      io.to(`challenge-${challengeId}`).emit('live-stats-update', stats);
    } catch (error) {
      console.error('Error broadcasting live stats:', error);
    }
  };

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'User ID:', socket.userId);

    // Join challenge room
    socket.on('join-challenge', (data) => {
      console.log('🏠 User joining challenge:', data);
      const { challengeId } = data;
      const userId = socket.userId; // Use authenticated userId
      
      if (!userId) {
        console.log('❌ No userId found for socket');
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      console.log('✅ User', userId, 'joining challenge', challengeId);
      
      // Join room for this challenge
      socket.join(`challenge-${challengeId}`);
      
      // Track users in challenge
      if (!challengeUsers.has(challengeId)) {
        challengeUsers.set(challengeId, new Set());
      }
      challengeUsers.get(challengeId).add(userId);
      
      // Store user info in socket
      socket.challengeId = challengeId;
      
      console.log('👥 Users in challenge', challengeId, ':', challengeUsers.get(challengeId).size);
      
      // Notify others about new user
      socket.to(`challenge-${challengeId}`).emit('user-joined', {
        userId,
        onlineCount: challengeUsers.get(challengeId).size
      });
      
      // Send current online count to the user
      socket.emit('online-users', {
        count: challengeUsers.get(challengeId).size
      });

      // Broadcast live statistics when user joins
      broadcastLiveStats(challengeId);
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      console.log('📤 Received send-message:', data);
      console.log('🔐 Socket userId:', socket.userId);
      console.log('🏠 Socket challengeId:', socket.challengeId);
      
      try {
        const { challengeId, content } = data;
        const userId = socket.userId; // Use authenticated userId
        
        if (!userId) {
          console.log('❌ No userId found for message');
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
        
        if (!challengeId || !content) {
          console.log('❌ Missing challengeId or content');
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }
        
        console.log('✅ Creating message from user', userId, 'in challenge', challengeId);
        
        // Create message in database
        const message = new Message({
          content: content.trim(),
          author: userId,
          challengeId
        });
        
        await message.save();
        await message.populate('author', 'fullName username avatar');
        
        console.log('💾 Message saved to database:', message._id);
        
        // Broadcast to all users in challenge (including sender)
        io.to(`challenge-${challengeId}`).emit('new-message', message);
        console.log('📡 Message broadcasted to challenge', challengeId);
        
      } catch (error) {
        console.error('❌ Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message like
    socket.on('like-message', async (data) => {
      try {
        const { messageId } = data;
        const userId = socket.userId; // Use authenticated userId
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
        
        const message = await Message.findById(messageId);
        if (!message) return;
        
        const likeIndex = message.likes.indexOf(userId);
        
        if (likeIndex > -1) {
          message.likes.splice(likeIndex, 1);
        } else {
          message.likes.push(userId);
        }
        
        await message.save();
        await message.populate('author', 'fullName username avatar');
        await message.populate('likes', 'fullName username');
        
        // Broadcast updated message to all users in challenge
        io.to(`challenge-${message.challengeId}`).emit('message-updated', message);
        
      } catch (error) {
        console.error('Error handling like:', error);
        socket.emit('error', { message: 'Failed to like message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { challengeId, username } = data;
      const userId = socket.userId; // Use authenticated userId
      
      if (!userId) return;
      
      socket.to(`challenge-${challengeId}`).emit('user-typing', {
        userId,
        username: username || 'User',
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { challengeId } = data;
      const userId = socket.userId; // Use authenticated userId
      
      if (!userId) return;
      
      socket.to(`challenge-${challengeId}`).emit('user-typing', {
        userId,
        isTyping: false
      });
    });

    // Join notification room
    socket.on('join-notifications', () => {
      const userId = socket.userId;
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined notification room`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      if (socket.challengeId && socket.userId) {
        // Remove user from challenge
        const users = challengeUsers.get(socket.challengeId);
        if (users) {
          users.delete(socket.userId);
          
          // Notify others about user leaving
          socket.to(`challenge-${socket.challengeId}`).emit('user-left', {
            userId: socket.userId,
            onlineCount: users.size
          });

          // Broadcast live statistics when user leaves
          broadcastLiveStats(socket.challengeId);
        }
      }
    });

    // Handle request for live statistics
    socket.on('request-live-stats', (data) => {
      const { challengeId } = data;
      if (challengeId) {
        broadcastLiveStats(challengeId);
      }
    });
  });
};
