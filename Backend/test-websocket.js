// test-websocket.js
const io = require('socket.io-client');

// Test WebSocket connection with authentication
const token = 'test-token'; // This would be a real JWT token

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  auth: {
    token: token
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test joining a challenge
  socket.emit('join-challenge', {
    challengeId: '697a038295aaad352c7a7c41'
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error.message);
});

socket.on('online-users', (data) => {
  console.log('👥 Online users:', data);
});

socket.on('user-joined', (data) => {
  console.log('👋 User joined:', data);
});

// Disconnect after 5 seconds
setTimeout(() => {
  socket.disconnect();
  console.log('🔌 Disconnected');
  process.exit(0);
}, 5000);
