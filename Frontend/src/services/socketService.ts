import { io, Socket } from 'socket.io-client';
import { authService } from './auth';
import { SOCKET_URL } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private challengeId: string | null = null;
  private userId: string | null = null;

  // Connect to WebSocket server
  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    
    // Get auth token using authService
    const token = authService.getToken();
    
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    this.socket.on('connect', () => {
      // Connection established
    });

    this.socket.on('disconnect', () => {
      // Connection lost
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  }

  // Join a challenge room
  joinChallenge(challengeId: string) {
    if (!this.socket || !this.userId) {
      console.error('❌ Cannot join challenge - socket or userId missing');
      return;
    }
    
    this.challengeId = challengeId;
    this.socket.emit('join-challenge', {
      challengeId
    });
  }

  leaveChallenge() {
    if (!this.socket || !this.challengeId) return;
    
    this.socket.emit('leave-challenge', {
      challengeId: this.challengeId
    });
    this.challengeId = null;
  }

  // Send a new message
  sendMessage(content: string) {
    if (!this.socket || !this.challengeId) {
      console.error('❌ Cannot send message - socket or challengeId missing');
      return;
    }
    
    this.socket.emit('send-message', {
      challengeId: this.challengeId,
      content
    });
  }

  // Like/unlike a message
  likeMessage(messageId: string) {
    if (!this.socket) return;
    
    this.socket.emit('like-message', {
      messageId
    });
  }

  // Start typing indicator
  startTyping() {
    if (!this.socket || !this.challengeId) return;
    
    this.socket.emit('typing-start', {
      challengeId: this.challengeId,
      username: 'User' // You can pass actual username from user context
    });
  }

  // Stop typing indicator
  stopTyping() {
    if (!this.socket || !this.challengeId) return;
    
    this.socket.emit('typing-stop', {
      challengeId: this.challengeId
    });
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-message', callback);
  }

  onMessageUpdated(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('message-updated', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user-joined', callback);
  }

  onOnlineUsers(callback: (users: any) => void) {
    if (!this.socket) return;
    this.socket.on('online-users', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user-left', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('user-typing', callback);
  }

  onTypingStart(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('typing-start', callback);
  }

  onTypingStop(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('typing-stop', callback);
  }

  onError(callback: (error: any) => void) {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  onConnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  onDisconnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('disconnect', callback);
  }

  // Generic event listener methods
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // Request live stats
  requestLiveStats(challengeId: string) {
    if (!this.socket) return;
    this.socket.emit('request-live-stats', { challengeId });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.challengeId = null;
    this.userId = null;
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
