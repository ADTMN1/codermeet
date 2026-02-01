// routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get messages for a challenge
router.get('/challenges/:challengeId/messages', messageController.getMessages);

// Create a new message
router.post('/challenges/:challengeId/messages', messageController.createMessage);

// Like/unlike a message
router.put('/messages/:messageId/like', messageController.toggleLike);

// Delete a message
router.delete('/messages/:messageId', messageController.deleteMessage);

// Reply to a message
router.post('/messages/:messageId/replies', messageController.createReply);

// Like/unlike a reply
router.put('/messages/:messageId/replies/:replyId/like', messageController.toggleReplyLike);

// Delete a reply
router.delete('/messages/:messageId/replies/:replyId', messageController.deleteReply);

module.exports = router;
