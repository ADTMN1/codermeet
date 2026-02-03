// services/messageService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { authService } from './auth';

export interface Message {
  _id: string;
  content: string;
  author: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  challengeId: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
  timeAgo?: string;
}

export interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  likes: string[];
  parentReply: string | null;
  createdAt: string;
  timeAgo?: string;
}

export interface CreateReplyData {
  content: string;
  parentReplyId?: string | null;
}

export interface CreateMessageData {
  content: string;
}

class MessageService {
  // Get messages for a challenge
  async getMessages(challengeId: string, page = 1, limit = 50): Promise<{ 
    data: Message[]; 
    pagination: any 
  }> {
    try {
      const token = authService.getToken();
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/challenges/${challengeId}/messages`,
        {
          params: { page, limit },
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MessageService error:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  }

  // Create a new message
  async createMessage(challengeId: string, messageData: CreateMessageData): Promise<Message> {
    try {
      const token = authService.getToken();
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/challenges/${challengeId}/messages`,
        messageData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  // Like/unlike a message
  async toggleLike(messageId: string): Promise<Message> {
    try {
      const token = authService.getToken();
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/messages/${messageId}/like`,
        {},
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const token = authService.getToken();
      await axios.delete(
        `${API_CONFIG.BASE_URL}/messages/${messageId}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  }

  // Create a reply to a message
  async createReply(messageId: string, replyData: CreateReplyData): Promise<Message> {
    try {
      const token = authService.getToken();
      
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/messages/${messageId}/replies`,
        replyData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create reply');
    }
  }

  // Like/unlike a reply
  async toggleReplyLike(messageId: string, replyId: string): Promise<Message> {
    try {
      const token = authService.getToken();
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/messages/${messageId}/replies/${replyId}/like`,
        {},
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle reply like');
    }
  }

  // Delete a reply
  async deleteReply(messageId: string, replyId: string): Promise<void> {
    try {
      const token = authService.getToken();
      await axios.delete(
        `${API_CONFIG.BASE_URL}/messages/${messageId}/replies/${replyId}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete reply');
    }
  }

  // Format time ago (client-side calculation as fallback)
  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export const messageService = new MessageService();
