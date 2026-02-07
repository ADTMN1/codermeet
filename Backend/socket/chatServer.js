const handleChatConnection = require('./chatHandler');

module.exports = (io) => {
  try {
    // Initialize chat handler
    handleChatConnection(io);
  } catch (error) {
    console.error('Error initializing chat server:', error);
  }
};
