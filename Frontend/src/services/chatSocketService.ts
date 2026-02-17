// services/chatSocketService.ts
import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

export interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'team' | 'direct' | 'channel' | 'group';
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
  }>;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  roomId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  messageType: 'standard' | 'system' | 'announcement' | 'reaction' | 'reply';
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    users: string[];
    count: number;
  }>;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  type?: 'public' | 'private' | 'team' | 'direct' | 'channel' | 'group';
  maxMembers?: number;
}

export interface SendMessageData {
  content: string;
  roomId: string;
  type?: 'text' | 'file';
  fileName?: string;
  fileSize?: number;
  messageId?: string;
}

class ChatSocketService {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private userId: string | null = null;

  // Connect to WebSocket server
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.userId = authService.getToken();
    
    // Get auth token using authService
    const token = this.userId;
    
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }
    
    // Socket.IO should connect to base URL without /api
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
    this.socket = io(`${socketUrl}/chat`, {
      auth: { token },
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    this.setupEventListeners();
  }

  // Setup all event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Chat socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Chat socket disconnected:', reason);
      this.currentRoomId = null;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Chat socket connection error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Chat socket error:', error);
    });
  }

  // Join a chat room
  joinRoom(roomId: string): void {
    if (!this.socket || !this.userId) {
      console.error('❌ Cannot join room - socket or userId missing');
      return;
    }
    
    this.currentRoomId = roomId;
    this.socket.emit('joinRoom', { roomId });
    console.log('🏠 Joined room:', roomId);
  }

  // Leave current room
  leaveRoom(): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('leaveRoom', { roomId: this.currentRoomId });
    console.log('🚪 Left room:', this.currentRoomId);
    this.currentRoomId = null;
  }

  // Send a new message
  sendMessage(messageData: SendMessageData): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Cannot send message - socket or room missing');
      return;
    }
    
    const message = {
      content: messageData.content,
      roomId: messageData.roomId,
      type: messageData.type || 'text',
      fileName: messageData.fileName,
      fileSize: messageData.fileSize,
      messageId: messageData.messageId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: this.userId,
      createdAt: new Date().toISOString()
    };

    this.socket.emit('sendMessage', message);
    console.log('📤 Sent message to room:', messageData.roomId);
  }

  // Start typing indicator
  startTyping(): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('typing', { 
      roomId: this.currentRoomId, 
      isTyping: true 
    });
  }

  // Stop typing indicator
  stopTyping(): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('typing', { 
      roomId: this.currentRoomId, 
      isTyping: false 
    });
  }

  // Add reaction to message
  addReaction(messageId: string, emoji: string): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('addReaction', {
      messageId,
      emoji,
      roomId: this.currentRoomId
    });
  }

  // Pin a message
  pinMessage(messageId: string): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('pinMessage', {
      messageId,
      roomId: this.currentRoomId
    });
  }

  // Delete a message
  deleteMessage(messageId: string): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('deleteMessage', {
      messageId,
      roomId: this.currentRoomId
    });
  }

  // Edit a message
  editMessage(messageId: string, content: string): void {
    if (!this.socket || !this.currentRoomId) return;
    
    this.socket.emit('editMessage', {
      messageId,
      content,
      roomId: this.currentRoomId
    });
  }

  // Generic event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.userId = null;
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current room ID
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const chatSocketService = new ChatSocketService();
