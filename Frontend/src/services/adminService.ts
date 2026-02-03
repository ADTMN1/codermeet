import axios from 'axios';
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// Retry mechanism for rate limited requests
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        // Wait for retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
};

export interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  plan: string;
  isProfessional: boolean;
  primaryLanguage?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  trialUsers: number;
  basicUsers: number;
  premiumUsers: number;
  professionalUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  monthlyGrowth: string;
  recentUsers: User[];
  recentActivity: number;
}

export interface SystemHealth {
  server: {
    uptime: number;
    memory: {
      used: string;
      total: string;
      external: string;
    };
    nodeVersion: string;
    platform: string;
  };
  database: {
    status: string;
    host: string;
    name: string;
  };
  timestamp: string;
}

export interface SystemActivity {
  registrations: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  distributions: {
    plans: Array<{ _id: string; count: number }>;
    roles: Array<{ _id: string; count: number }>;
    professional: {
      yes: number;
      no: number;
    };
  };
  timestamp: string;
}

export const adminService = {
  // Admin profile methods
  getProfile: async () => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/profile`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  updateProfile: async (profileData: any) => {
    return retryRequest(async () => {
      const response = await axios.put(`${API_URL}/api/admin/profile`, profileData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    });
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    return retryRequest(async () => {
      const response = await axios.put(`${API_URL}/api/admin/change-password`, passwordData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    });
  },

  toggleTwoFactor: async (enabled: boolean) => {
    return retryRequest(async () => {
      const response = await axios.post(`${API_URL}/api/admin/toggle-2fa`, { enabled }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    });
  },

  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: getAuthHeaders(),
      });
      return response.data.data || response.data; // Handle both response formats
    });
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const url = `${API_URL}/api/admin/stats`;
    
    try {
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
      });
      
      const result = response.data.data || response.data;
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId: string, role: string): Promise<User> => {
    return retryRequest(async () => {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${userId}/role`,
        { role },
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    });
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    return retryRequest(async () => {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });
    });
  },

  // Get system health
  getSystemHealth: async (): Promise<SystemHealth> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/system/health`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  // Get system activity
  getSystemActivity: async (): Promise<SystemActivity> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/system/activity`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },
};
