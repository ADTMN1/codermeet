// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { Message } from './messageService';

class SocketService {
  private socket: Socket | null = null;
  private challengeId: string | null = null;
  private userId: string | null = null;

  // Connect to WebSocket server
  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    this.userId = userId;
    
    // Get auth token
    const token = localStorage.getItem('auth_token');
    console.log('🔑 Auth token found:', !!token);
    
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      return;
    }
    
    console.log('🔌 Connecting to WebSocket server...');
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      },
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('🆔 Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  }

  // Join a challenge room
  joinChallenge(challengeId: string) {
    if (!this.socket || !this.userId) {
      console.error('❌ Cannot join challenge - socket or userId missing');
      console.log('🔍 Debug - socket exists:', !!this.socket, 'userId:', this.userId);
      return;
    }
    
    this.challengeId = challengeId;
    console.log('🏠 Emitting join-challenge for:', challengeId, 'by user:', this.userId);
    this.socket.emit('join-challenge', {
      challengeId
    });
  }

  // Leave current challenge
  leaveChallenge() {
    if (!this.socket || !this.challengeId) return;
    
    console.log('🚪 Emitting leave-challenge for:', this.challengeId);
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
    
    console.log('📤 Emitting send-message:', { challengeId: this.challengeId, content });
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
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('new-message', callback);
  }

  onMessageUpdated(callback: (message: Message) => void) {
    this.socket?.on('message-updated', callback);
  }

  onUserJoined(callback: (data: { userId: string; onlineCount: number }) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string; onlineCount: number }) => void) {
    this.socket?.on('user-left', callback);
  }

  onUserTyping(callback: (data: { userId: string; username?: string; isTyping: boolean }) => void) {
    this.socket?.on('user-typing', callback);
  }

  onOnlineUsers(callback: (data: { count: number }) => void) {
    this.socket?.on('online-users', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  onConnect(callback: () => void) {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void) {
    this.socket?.on('disconnect', callback);
  }

  // Remove event listeners
  off(event: string, callback?: any) {
    this.socket?.off(event, callback);
  }

  // Disconnect from WebSocket
  disconnect() {
    this.leaveChallenge();
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
