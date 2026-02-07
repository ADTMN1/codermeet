const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  getChatRooms,
  createChatRoom,
  getChatRoomById,
  joinChatRoom,
  leaveChatRoom,
  getRoomMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  addReaction,
  pinMessage,
  getOnlineUsers
} = require('../controllers/chatController');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Rate limiting
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many messages sent from this IP, please try again later.',
  standardHeaders: {
    res: {
      'Retry-After': 15 * 60 // 15 minutes
    }
  }
});

const roomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 room operations per hour
  message: 'Too many room operations, please try again later.',
  standardHeaders: {
    res: {
      'Retry-After': 3600 // 1 hour
    }
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file) => {
    const uploadPath = path.join(__dirname, '../uploads', 'chat', file.originalname);
    return uploadPath;
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const upload = multer({ storage });

// Apply authentication to all routes
router.use(authenticateToken);

// Chat Room Routes
router.get('/rooms', getChatRooms);
router.post('/rooms', roomLimiter, createChatRoom);
router.get('/rooms/:roomId', getChatRoomById);
router.post('/rooms/:roomId/join', roomLimiter, joinChatRoom);
router.post('/rooms/:roomId/leave', roomLimiter, leaveChatRoom);

// Message Routes
router.get('/rooms/:roomId/messages', messageLimiter, getRoomMessages);
router.post('/rooms/:roomId/messages', messageLimiter, sendMessage);
router.put('/rooms/:roomId/messages/:messageId', messageLimiter, editMessage);
router.delete('/rooms/:roomId/messages/:messageId', messageLimiter, deleteMessage);

// Reaction Routes
router.post('/rooms/:roomId/messages/:messageId/reactions', messageLimiter, addReaction);
router.post('/rooms/:roomId/messages/:messageId/pin', messageLimiter, pinMessage);

// File Upload Routes
router.post('/rooms/:roomId/upload', upload.array('files', 5), async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Verify user has access to room
    const ChatRoom = require('../models/chatRoom');
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.members.some(member => member.userId.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Create message with attachments
    const message = new (require('../models/chatMessage'))({
      content: req.body.content || 'Shared files',
      senderId: userId,
      roomId,
      type: 'file',
      attachments: files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'file',
        url: `/uploads/chat/${file.filename}`,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      }))
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
});

// Online Users Route
router.get('/rooms/:roomId/online', getOnlineUsers);

// Search Routes
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const userId = req.user.id;

    let query = {};
    
    if (type === 'public') {
      query = {
        type: 'public',
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: q.split(' ').map(tag => new RegExp(tag, 'i')) } }
        ]
      };
    } else if (type === 'my') {
      query = {
        $or: [
          { 'members.userId': userId },
          { 'admins.userId': userId }
        ]
      };
    }

    const ChatRoom = require('../models/chatRoom');
    const rooms = await ChatRoom.find(query)
      .populate('members.userId', 'fullName username avatar')
      .limit(20);

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching rooms',
      error: error.message
    });
  }
});

// Typing Indicators Route
router.post('/rooms/:roomId/typing', (req, res) => {
  try {
    const { roomId } = req.params;
    const { isTyping } = req.body;
    const userId = req.user.id;

    // This would typically emit via Socket.IO
    // For now, just return success
    res.status(200).json({
      success: true,
      message: 'Typing status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating typing status',
      error: error.message
    });
  }
});

module.exports = router;
