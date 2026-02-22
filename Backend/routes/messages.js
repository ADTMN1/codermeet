// routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middlewares/auth');


// Apply auth middleware to all routes
router.use(auth);


// Reply to a message - MOVED TO TOP
router.post('/:messageId/replies', messageController.createReply);

// Get messages for a challenge
router.get('/challenges/:challengeId/messages', messageController.getMessages);
router.get('/weekly-challenges/:challengeId/messages', messageController.getMessages);

// Create a new message
router.post('/challenges/:challengeId/messages', messageController.createMessage);
router.post('/weekly-challenges/:challengeId/messages', messageController.createMessage);

// Like/unlike a message
router.put('/:messageId/like', messageController.toggleLike);

// Delete a message
router.delete('/:messageId', messageController.deleteMessage);

// Like/unlike a reply
router.put('/:messageId/replies/:replyId/like', messageController.toggleReplyLike);

// Delete a reply
router.delete('/:messageId/replies/:replyId', messageController.deleteReply);

module.exports = router;
