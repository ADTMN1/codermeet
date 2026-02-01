// services/leaderboardService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface LeaderboardUser {
  _id: string;
  username: string;
  fullName: string;
  points: number;
  rank: number;
  avatar?: string;
  profileImage?: string;
  plan: string;
  role: string;
  lastPointsUpdate: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string;
    plan: string;
    role: string;
    timeRange: string;
    sortBy: string;
    sortOrder: string;
  };
}

class LeaderboardService {
  // Get leaderboard data
  async getLeaderboard(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    plan?: string;
    role?: string;
    timeRange?: string;
  } = {}): Promise<LeaderboardUser[]> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/leaderboard`, { params });
      
      // Handle the mock data format from backend
      if (Array.isArray(response.data)) {
        return response.data.map((user: any, index: number) => ({
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          points: user.points,
          rank: user.rank || index + 1,
          avatar: user.avatar || user.profileImage,
          profileImage: user.profileImage || user.avatar,
          plan: user.plan || 'Trial',
          role: user.role || 'user',
          lastPointsUpdate: new Date().toISOString(),
          isCurrentUser: false
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }

  // Get top users for preview
  async getTopUsers(limit: number = 5): Promise<LeaderboardUser[]> {
    try {
      const users = await this.getLeaderboard({ limit, sortBy: 'points', sortOrder: 'desc' });
      return users.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top users:', error);
      // Return empty array to show error state in UI
      return [];
    }
  }

  // Get user rank
  async getUserRank(userId: string): Promise<{ user: LeaderboardUser; rank: number }> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/leaderboard/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user rank:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user rank');
    }
  }

  // Real-time updates helper
  startRealTimeUpdates(
    callback: (data: LeaderboardUser[]) => void,
    interval: number = 30000,
    params: any = {}
  ): () => void {
    let intervalId: NodeJS.Timeout;

    const fetchUpdates = async () => {
      try {
        const data = await this.getLeaderboard(params);
        callback(data);
      } catch (error) {
        console.error('Error in real-time updates:', error);
      }
    };

    // Initial fetch
    fetchUpdates();

    // Set up interval
    intervalId = setInterval(fetchUpdates, interval);

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}

export const leaderboardService = new LeaderboardService();
