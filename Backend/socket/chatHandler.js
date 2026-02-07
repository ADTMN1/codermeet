const ChatRoom = require('../models/chatRoom');
const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Store connected users and their rooms
const connectedUsers = new Map(); // userId -> socket
const userRooms = new Map(); // userId -> Set of roomIds

// Authentication middleware for Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    console.log('🔐 Socket handshake auth:', socket.handshake.auth);
    console.log('🔐 Socket handshake headers:', socket.handshake.headers);
    
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ No token found in socket auth');
      return next(new Error('Authentication required'));
    }

    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔑 Token decoded:', decoded);
    
    const user = await User.findById(decoded.id).select('fullName username avatar');
    
    if (!user) {
      console.log('❌ User not found for ID:', decoded.id);
      return next(new Error('User not found'));
    }

    console.log('✅ User authenticated:', user.fullName);
    socket.userId = user._id;
    socket.user = user;
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Helper functions
const getRoomUsers = (roomId) => {
  const roomUsers = [];
  for (const [userId, socket] of connectedUsers) {
    if (userRooms.get(userId)?.has(roomId)) {
      const user = socket.user;
      roomUsers.push({
        userId,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar,
        isOnline: true
      });
    }
  }
  return roomUsers;
};

const broadcastToRoom = (io, roomId, event, data, excludeSocket = null) => {
  const roomUsers = getRoomUsers(roomId);
  roomUsers.forEach(roomUser => {
    const socket = connectedUsers.get(roomUser.userId);
    if (socket && socket !== excludeSocket) {
      socket.emit(event, data);
    }
  });
};

const sendSystemMessage = (io, roomId, content, type = 'system') => {
  const systemMessage = new ChatMessage({
    content,
    senderId: null, // System messages don't have senders
    roomId,
    type: 'text',
    messageType: type
  });
  
  systemMessage.save().catch(err => console.error('Error saving system message:', err));
  
  broadcastToRoom(io, roomId, 'newMessage', {
    ...systemMessage.toJSON(),
    sender: null,
    timestamp: new Date()
  });
};

// Main chat handler
const handleChatConnection = (io) => {
  console.log('🚀 Initializing chat handler...');
  io.use(authenticateSocket);

  // Handle connection after authentication
  io.on('connection', async (socket) => {
    try {
      console.log(`🔌 User ${socket.user?.fullName} connected to chat with socket ID: ${socket.id}`);
      
      // Add to connected users
      connectedUsers.set(socket.userId, socket);
      
      // Join user to their existing rooms (reconnection)
      const userRoomIds = await ChatRoom.find({
        'members.userId': socket.userId
      }).distinct('_id');
      
      userRooms.set(socket.userId, new Set(userRoomIds.map(room => room._id.toString())));
      
      // Join each room
      for (const roomId of userRoomIds) {
        socket.join(roomId);
        const roomUsers = getRoomUsers(roomId);
        
        // Notify others in the room
        socket.to(roomId).emit('userJoined', {
          userId: socket.userId,
          fullName: socket.user.fullName,
          username: socket.user.username,
          avatar: socket.user.avatar,
          roomUsers
        });
      }
      
      // Send user's rooms
      const rooms = await ChatRoom.find({
        'members.userId': socket.userId
      }).populate('members.userId', 'fullName username');
      
      socket.emit('roomsList', rooms);
      
      // Handle events
      socket.on('joinRoom', async (data) => {
        try {
          const { roomId } = data;
          
          // Verify user has access
          const room = await ChatRoom.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          
          const isMember = room.members.some(member => member.userId.toString() === socket.userId);
          if (!isMember && room.type !== 'public') {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
          
          // Join the room
          socket.join(roomId);
          
          // Add to user's room list
          const userRoomIds = userRooms.get(socket.userId) || new Set();
          userRoomIds.add(roomId);
          userRooms.set(socket.userId, userRoomIds);
          
          // Update room member list
          const existingMember = room.members.find(member => member.userId.toString() === socket.userId);
          if (!existingMember) {
            room.members.push({
              userId: socket.userId,
              role: 'member',
              joinedAt: new Date(),
              lastSeen: new Date(),
              isOnline: true,
              permissions: ['read', 'write']
            });
            room.currentMembers += 1;
            room.lastActivity = new Date();
            await room.save();
          }
          
          // Notify others in the room
          const roomUsers = getRoomUsers(roomId);
          socket.to(roomId).emit('userJoined', {
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            avatar: socket.user.avatar,
            roomUsers
          });
          
          // Send room details
          socket.emit('roomJoined', {
            ...room.toJSON(),
            userRole: room.ownerId.toString() === socket.userId ? 'owner' : 'member'
          });
          
          console.log(`User ${socket.user.fullName} joined room ${room.name}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error joining room' });
          console.error('Join room error:', error);
        }
      });
      
      socket.on('leaveRoom', async (data) => {
        try {
          const { roomId } = data;
          
          // Leave the room
          socket.leave(roomId);
          
          // Remove from user's room list
          const userRoomIds = userRooms.get(socket.userId) || new Set();
          userRoomIds.delete(roomId);
          userRooms.set(socket.userId, userRoomIds);
          
          // Update room
          const room = await ChatRoom.findById(roomId);
          if (room) {
            room.members = room.members.filter(member => member.userId.toString() !== socket.userId);
            room.currentMembers = Math.max(0, room.currentMembers - 1);
            room.lastActivity = new Date();
            await room.save();
          }
          
          // Notify others in the room
          const roomUsers = getRoomUsers(roomId);
          socket.to(roomId).emit('userLeft', {
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            roomUsers
          });
          
          console.log(`User ${socket.user.fullName} left room ${room.name}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error leaving room' });
          console.error('Leave room error:', error);
        }
      });
      
      socket.on('sendMessage', async (data) => {
        try {
          console.log('📨 Received sendMessage event:', data);
          const { roomId, content, type = 'text', replyTo, mentions, fileName, fileSize } = data;
          
          // Verify user has access to room
          const room = await ChatRoom.findById(roomId);
          if (!room || !room.members.some(member => member.userId.toString() === socket.userId)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
          
          // Create message
          const message = new ChatMessage({
            content: content.trim(),
            senderId: socket.userId,
            roomId,
            type,
            messageType: 'standard',
            replyTo: replyTo || null,
            mentions: mentions || [],
            deliveryStatus: 'delivered',
            fileName: fileName || null,
            fileSize: fileSize || null
          });
          
          const savedMessage = await message.save();
          
          // Update room activity
          room.lastActivity = new Date();
          room.stats.totalMessages += 1;
          await room.save();
          
          // Populate message details
          const populatedMessage = await ChatMessage.findById(savedMessage._id)
            .populate('senderId', 'fullName username avatar')
            .populate('replyTo')
            .populate('mentions.userId', 'fullName username');
          
          // Broadcast to room
          broadcastToRoom(io, roomId, 'newMessage', populatedMessage.toJSON());
          
          // Handle mentions
          if (mentions && mentions.length > 0) {
            mentions.forEach(mention => {
              const mentionedSocket = connectedUsers.get(mention);
              if (mentionedSocket) {
                mentionedSocket.emit('mentioned', {
                  messageId: savedMessage._id,
                  content,
                  mentionedBy: {
                    userId: socket.userId,
                    fullName: socket.user.fullName,
                    username: socket.user.username
                  }
                });
              }
            });
          }
          
          console.log(`Message sent in room ${room.name} by ${socket.user.fullName}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error sending message' });
          console.error('Send message error:', error);
        }
      });
      
      socket.on('typing', async (data) => {
        try {
          console.log('⌨️ Received typing event:', data);
          const { roomId, isTyping } = data;
          
          // Verify user has access to room
          const room = await ChatRoom.findById(roomId);
          if (!room || !room.members.some(member => member.userId.toString() === socket.userId)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
          
          // Broadcast typing status to room
          socket.to(roomId).emit('userTyping', {
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            avatar: socket.user.avatar,
            isTyping
          });
          
        } catch (error) {
          socket.emit('error', { message: 'Error updating typing status' });
          console.error('Typing error:', error);
        }
      });
      
      socket.on('addReaction', async (data) => {
        try {
          const { roomId, messageId, emoji } = data;
          
          // Verify user has access
          const room = await ChatRoom.findById(roomId);
          if (!room || !room.members.some(member => member.userId.toString() === socket.userId)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
          
          // Find message and add reaction
          const message = await ChatMessage.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }
          
          // Handle reaction logic
          const existingReaction = message.reactions.find(r => r.emoji === emoji);
          if (existingReaction) {
            // Remove user from existing reaction
            existingReaction.users = existingReaction.users.filter(id => id.toString() !== socket.userId);
            existingReaction.count = existingReaction.users.length;
            
            if (existingReaction.count === 0) {
              // Remove reaction entirely
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            // Add new reaction
            message.reactions.push({
              emoji,
              users: [socket.userId],
              count: 1
            });
          }
          
          await message.save();
          
          // Broadcast reaction update
          const reactionData = {
            messageId,
            emoji,
            count: existingReaction ? existingReaction.count : 1,
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username
          };
          
          broadcastToRoom(io, roomId, 'reactionAdded', reactionData);
          
          console.log(`Reaction ${emoji} added to message by ${socket.user.fullName}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error adding reaction' });
          console.error('Reaction error:', error);
        }
      });
      
      socket.on('pinMessage', async (data) => {
        try {
          const { roomId, messageId } = data;
          
          // Verify user has access and permissions
          const room = await ChatRoom.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          
          const member = room.members.find(member => member.userId.toString() === socket.userId);
          const canPin = member && (
            member.role === 'owner' ||
            member.role === 'admin' ||
            member.permissions.includes('pin_messages')
          );
          
          if (!canPin) {
            socket.emit('error', { message: 'Insufficient permissions' });
            return;
          }
          
          const message = await ChatMessage.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }
          
          // Add to pinned messages
          room.pinnedMessages.push({
            messageId: message._id,
            pinnedBy: socket.userId,
            pinnedAt: new Date()
          });
          
          message.isPinned = true;
          await room.save();
          await message.save();
          
          // Broadcast pin update
          const pinData = {
            messageId,
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            pinnedAt: new Date()
          };
          
          broadcastToRoom(io, roomId, 'messagePinned', pinData);
          
          console.log(`Message pinned by ${socket.user.fullName}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error pinning message' });
          console.error('Pin message error:', error);
        }
      });
      
      socket.on('editMessage', async (data) => {
        try {
          const { roomId, messageId, content } = data;
          
          // Verify user has access and permissions
          const room = await ChatRoom.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          
          const member = room.members.find(member => member.userId.toString() === socket.userId);
          const canEdit = member && (
            member.role === 'owner' ||
            member.role === 'admin' ||
            member.permissions.includes('write')
          );
          
          if (!canEdit) {
            socket.emit('error', { message: 'Insufficient permissions' });
            return;
          }
          
          const message = await ChatMessage.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }
          
          // Add to edit history
          message.editHistory.push({
            content: message.content,
            editedAt: message.createdAt,
            editedBy: socket.userId
          });
          
          message.content = content.trim();
          message.isEdited = true;
          await message.save();
          
          // Broadcast edit update
          const editData = {
            messageId,
            content,
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            editedAt: new Date()
          };
          
          broadcastToRoom(io, roomId, 'messageEdited', editData);
          
          console.log(`Message edited by ${socket.user.fullName}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error editing message' });
          console.error('Edit message error:', error);
        }
      });
      
      socket.on('deleteMessage', async (data) => {
        try {
          const { roomId, messageId } = data;
          
          // Verify user has access and permissions
          const room = await ChatRoom.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }
          
          const member = room.members.find(member => member.userId.toString() === socket.userId);
          const canDelete = member && (
            member.role === 'owner' ||
            member.role === 'admin' ||
            member.permissions.includes('delete')
          );
          
          if (!canDelete) {
            socket.emit('error', { message: 'Insufficient permissions' });
            return;
          }
          
          const message = await ChatMessage.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }
          
          // Soft delete
          message.isDeleted = true;
          message.deletedAt = new Date();
          await message.save();
          
          // Broadcast delete update
          const deleteData = {
            messageId,
            userId: socket.userId,
            fullName: socket.user.fullName,
            username: socket.user.username,
            deletedAt: new Date()
          };
          
          broadcastToRoom(io, roomId, 'messageDeleted', deleteData);
          
          console.log(`Message deleted by ${socket.user.fullName}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Error deleting message' });
          console.error('Delete message error:', error);
        }
      });
      
      socket.on('disconnect', async () => {
        try {
          console.log(`User ${socket.user.fullName} disconnected`);
          
          // Remove from connected users
          connectedUsers.delete(socket.userId);
          
          // Update all rooms user was in
          const userRoomIds = userRooms.get(socket.userId) || new Set();
          for (const roomId of userRoomIds) {
            socket.leave(roomId);
            
            // Update room member status
            const room = await ChatRoom.findById(roomId);
            if (room) {
              const member = room.members.find(member => member.userId.toString() === socket.userId);
              if (member) {
                member.isOnline = false;
                member.lastSeen = new Date();
                await room.save();
                
                // Notify others in room
                socket.to(roomId).emit('userOffline', {
                  userId: socket.userId,
                  fullName: socket.user.fullName,
                  username: socket.user.username
                });
              }
            }
          }
          
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  });
};

module.exports = handleChatConnection;
