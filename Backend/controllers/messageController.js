// controllers/messageController.js
const Message = require('../models/message');
const Challenge = require('../models/challenge');
const User = require('../models/user');

// Get messages for a challenge
exports.getMessages = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const messages = await Message.find({ challengeId })
      .populate('author', 'fullName username avatar')
      .populate('likes', 'fullName username')
      .populate('replies.author', 'fullName username avatar')
      .populate('replies.likes', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ challengeId });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Create message
    const message = new Message({
      content: content.trim(),
      author: userId,
      challengeId
    });

    await message.save();

    // Populate author info
    await message.populate('author', 'fullName username avatar');

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating message',
      error: error.message
    });
  }
};

// Like/unlike a message
exports.toggleLike = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const likeIndex = message.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      message.likes.splice(likeIndex, 1);
    } else {
      // Like
      message.likes.push(userId);
    }

    await message.save();
    await message.populate('author', 'fullName username avatar');
    await message.populate('likes', 'fullName username');

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Message unliked' : 'Message liked',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// Delete a message (author only)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await Message.findByIdAndDelete(messageId);

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

// Create a new reply
exports.createReply = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = req.user.id;

    console.log('🔍 Reply request:', { messageId, content, parentReplyId, userId });

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      console.log('❌ Message not found:', messageId);
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    console.log('✅ Message found:', message._id, 'Challenge:', message.challengeId);

    // Verify user is part of the challenge
    const challenge = await Challenge.findById(message.challengeId);
    if (!challenge) {
      console.log('❌ Challenge not found:', message.challengeId);
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    console.log('✅ Challenge found:', challenge._id, 'Participants:', challenge.participants.length);
    
    // Debug: Log all participants in detail
    console.log('🔍 All participants:', challenge.participants.map(p => ({
      participantId: p._id,
      userId: p.user?._id,
      fullName: p.user?.fullName,
      joinedAt: p.joinedAt,
      participantObject: p
    })));

    // Check if user is registered for the challenge
    const isRegistered = challenge.participants.some(
      participant => {
        // Handle both direct user ID and nested user object
        const participantUserId = participant.user?._id || participant._id || participant;
        console.log('🔍 Checking participant:', {
          participantUserId,
          targetUserId: userId,
          match: participantUserId.toString() === userId,
          participantObject: participant
        });
        return participantUserId.toString() === userId;
      }
    );

    console.log('👤 User registration check:', { 
      userId, 
      isRegistered, 
      participants: challenge.participants.map(p => ({
        id: p.user?._id || p._id || p,
        name: p.user?.fullName || 'Unknown'
      }))
    });

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this challenge to reply'
      });
    }

    // Create reply
    const reply = {
      content: content.trim(),
      author: userId,
      likes: [],
      parentReply: parentReplyId || null
    };

    message.replies.push(reply);
    message.updatedAt = new Date();

    await message.save();
    await message.populate([
      { path: 'author', select: 'fullName username avatar' },
      { path: 'replies.author', select: 'fullName username avatar' },
      { path: 'replies.likes', select: 'fullName username' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating reply',
      error: error.message
    });
  }
};

// Like/unlike a reply
exports.toggleReplyLike = async (req, res) => {
  try {
    const { messageId, replyId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the reply
    const reply = message.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const likeIndex = reply.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(userId);
    }

    message.updatedAt = new Date();

    await message.save();
    await message.populate([
      { path: 'author', select: 'fullName username avatar' },
      { path: 'replies.author', select: 'fullName username avatar' },
      { path: 'replies.likes', select: 'fullName username' }
    ]);

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Reply unliked' : 'Reply liked',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling reply like',
      error: error.message
    });
  }
};

// Delete a reply (author or admin only)
exports.deleteReply = async (req, res) => {
  try {
    const { messageId, replyId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the reply
    const reply = message.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Check if user is the author or admin
    const isAdmin = req.user.role === 'admin';
    const isAuthor = reply.author.toString() === userId;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own replies'
      });
    }

    // Remove reply from array
    message.replies.pull({ _id: replyId });
    message.updatedAt = new Date();

    await message.save();
    await message.populate([
      { path: 'author', select: 'fullName username avatar' },
      { path: 'replies.author', select: 'fullName username avatar' },
      { path: 'replies.likes', select: 'fullName username' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting reply',
      error: error.message
    });
  }
};
