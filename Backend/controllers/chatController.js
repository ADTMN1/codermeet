const ChatRoom = require('../models/chatRoom');
const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');

// Get all chat rooms for user
exports.getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await ChatRoom.find({
      $or: [
        { 'members.userId': userId },
        { type: 'public' },
        { type: { $ne: 'direct' } }
      ]
    })
    .populate('members.userId', 'fullName username avatar')
    .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      data: rooms.map(room => ({
        ...room.toJSON(),
        unreadCount: Math.floor(Math.random() * 10), // Mock unread count
        isOnline: room.members && room.members.filter(member => member.isOnline).length > 0
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms',
      error: error.message
    });
  }
};

// Create new chat room
exports.createChatRoom = async (req, res) => {
  try {
    const { name, description, type, maxMembers, tags, category, joinRequirements, joinPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Room name cannot exceed 100 characters'
      });
    }

    // Check for duplicate room names
    const existingRoom = await ChatRoom.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      ownerId: userId
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'You already have a room with this name'
      });
    }

    const roomData = {
      name: name.trim(),
      description: description?.trim() || '',
      type: type || 'public',
      maxMembers: Math.min(maxMembers || 100, 1000),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      category: category || 'general',
      joinRequirements: joinRequirements || 'none',
      joinPassword: joinPassword || null,
      ownerId: userId,
      members: [{
        userId,
        role: 'owner',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true,
        permissions: ['read', 'write', 'delete', 'manage_members', 'pin_messages', 'manage_room']
      }],
      currentMembers: 1,
      stats: {
        totalMessages: 0,
        totalMembers: 1,
        activeMembers: 1,
        peakOnline: 1
      },
      lastActivity: new Date(),
      settings: {
        allowFileUploads: true,
        allowVoiceMessages: true,
        allowVideoCalls: true,
        allowScreenSharing: false,
        messageRetention: 30,
        autoDeleteMessages: false,
        enableSlowMode: false,
        customWelcomeMessage: `Welcome to ${name}! 🎉`
      }
    };

    const room = new ChatRoom(roomData);
    await room.save();

    // Add welcome message
    if (room.settings.customWelcomeMessage) {
      const welcomeMessage = new ChatMessage({
        content: room.settings.customWelcomeMessage,
        senderId: userId,
        roomId: room._id,
        type: 'text',
        messageType: 'system'
      });
      await welcomeMessage.save();
    }

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: room.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chat room',
      error: error.message
    });
  }
};

// Get chat room by ID
exports.getChatRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId)
      .populate('members.userId', 'fullName username avatar')
      .populate('pinnedMessages.messageId')
      .populate('pinnedMessages.pinnedBy', 'fullName username');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user has access
    const isMember = room.members.some(member => member.userId.toString() === userId);
    const isOwner = room.ownerId.toString() === userId;
    const isAdmin = room.admins.some(admin => admin.userId.toString() === userId);

    if (!isMember && room.type === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Private room'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...room.toJSON(),
        userRole: isOwner ? 'owner' : isAdmin ? 'admin' : 'member',
        hasAccess: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat room',
      error: error.message
    });
  }
};

// Join chat room
exports.joinChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check join requirements
    if (room.joinRequirements === 'password' && room.joinPassword !== password) {
      return res.status(403).json({
        success: false,
        message: 'Invalid password'
      });
    }

    if (room.joinRequirements === 'approval') {
      return res.status(403).json({
        success: false,
        message: 'Room requires admin approval'
      });
    }

    // Check if room is full
    if (room.currentMembers >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if already a member
    const isMember = room.members.some(member => member.userId.toString() === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this room'
      });
    }

    // Add user to room
    room.members.push({
      userId,
      role: 'member',
      joinedAt: new Date(),
      lastSeen: new Date(),
      isOnline: true,
      permissions: ['read', 'write']
    });

    room.currentMembers += 1;
    room.lastActivity = new Date();
    await room.save();

    // Join notification
    const joinMessage = new ChatMessage({
      content: `${req.user.fullName} joined the room 🎉`,
      senderId: userId,
      roomId: room._id,
      type: 'text',
      messageType: 'system'
    });
    await joinMessage.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined chat room',
      data: room.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining chat room',
      error: error.message
    });
  }
};

// Leave chat room
exports.leaveChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Remove user from room
    room.members = room.members.filter(member => member.userId.toString() !== userId);
    room.currentMembers = Math.max(0, room.currentMembers - 1);
    room.lastActivity = new Date();
    await room.save();

    // Leave notification
    const leaveMessage = new ChatMessage({
      content: `${req.user.fullName} left the room 👋`,
      senderId: userId,
      roomId: room._id,
      type: 'text',
      messageType: 'system'
    });
    await leaveMessage.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left chat room'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error leaving chat room',
      error: error.message
    });
  }
};

// Get messages for a room
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user.id;

    // Verify user has access to room
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.members.some(member => member.userId.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = { roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .populate('senderId', 'fullName username avatar')
      .populate('replyTo')
      .populate('mentions.userId', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ChatMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', replyTo, attachments, mentions } = req.body;
    const userId = req.user.id;

    // Verify user has access to room
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.members.some(member => member.userId.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const messageData = {
      content: content.trim(),
      senderId: userId,
      roomId,
      type,
      messageType: 'standard',
      replyTo: replyTo || null,
      mentions: mentions || [],
      attachments: attachments || [],
      deliveryStatus: 'sent',
      priority: content.includes('urgent') ? 'high' : 'normal'
    };

    const message = new ChatMessage(messageData);
    await message.save();

    // Update room activity
    room.lastActivity = new Date();
    room.stats.totalMessages += 1;
    await room.save();

    // Process mentions
    if (mentions && mentions.length > 0) {
      // Notify mentioned users
      mentions.forEach(mention => {
        // Add notification logic here
      });
    }

    // Process reply
    if (replyTo) {
      const originalMessage = await ChatMessage.findById(replyTo);
      if (originalMessage) {
        originalMessage.replies.push(message._id);
        await originalMessage.save();
      }
    }

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('senderId', 'fullName username avatar')
      .populate('replyTo')
      .populate('mentions.userId', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    const member = room.members.find(member => member.userId.toString() === userId);
    const canDelete = member && (
      member.role === 'owner' ||
      member.role === 'admin' ||
      member.permissions.includes('delete')
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    const member = room.members.find(member => member.userId.toString() === userId);
    const canEdit = member && (
      member.role === 'owner' ||
      member.role === 'admin' ||
      member.permissions.includes('write')
    );

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Add to edit history
    message.editHistory.push({
      content: message.content,
      editedAt: message.createdAt,
      editedBy: userId
    });

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('senderId', 'fullName username avatar');

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: populatedMessage.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find existing reaction
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      // Remove user from existing reaction
      existingReaction.users = existingReaction.users.filter(id => id.toString() !== userId);
      existingReaction.count = existingReaction.users.length;
      
      if (existingReaction.count === 0) {
        // Remove reaction entirely
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      // Add to existing reaction
      existingReaction.users.push(userId);
      existingReaction.count += 1;
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      data: { emoji, count: existingReaction ? existingReaction.count : 1 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

// Pin message
exports.pinMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    const member = room.members.find(member => member.userId.toString() === userId);
    const canPin = member && member.permissions.includes('pin_messages');

    if (!canPin) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Add to pinned messages
    room.pinnedMessages.push({
      messageId: message._id,
      pinnedBy: userId,
      pinnedAt: new Date()
    });

    message.isPinned = true;
    await room.save();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message pinned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error pinning message',
      error: error.message
    });
  }
};

// Get online users in room
exports.getOnlineUsers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Check if user has access
    const isMember = room.members.some(member => member.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const onlineMembers = room.members.filter(member => member.isOnline);
    
    res.status(200).json({
      success: true,
      data: onlineMembers.map(member => ({
        userId: member.userId,
        fullName: member.fullName,
        username: member.username,
        avatar: member.avatar,
        lastSeen: member.lastSeen
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching online users',
      error: error.message
    });
  }
};
