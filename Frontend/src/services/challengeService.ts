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

export interface Challenge {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  requirements: string[];
  deliverables: string[];
  resources: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  currentParticipants: number;
  participants: Array<{
    user: any;
    joinedAt: string;
  }>;
  submissions: Array<{
    _id: string;
    userId: any;
    submittedAt: string;
    content: string;
    files: Array<{
      filename: string;
      url: string;
      size: number;
    }>;
    githubUrl: string;
    liveDemoUrl: string;
    description: string;
    status: string;
    score: number;
    feedback: string;
    reviewedBy: any;
    reviewedAt: string;
  }>;
  prizes: Array<{
    _id: string;
    position: number;
    prize: string;
    value: number;
    currency: string;
    winner: any;
    awardedAt: string;
  }>;
  status: string;
  featured: boolean;
  image: string;
  createdBy: any;
  judges: Array<{
    user: any;
    role: string;
  }>;
  evaluationCriteria: Array<{
    criterion: string;
    weight: number;
    description: string;
  }>;
  winnerAnnounced: boolean;
  winnerAnnouncedAt: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  daysRemaining?: number;
  totalSubmissions?: number;
}

export interface ChallengeStats {
  overview: {
    totalChallenges: number;
    draftChallenges: number;
    publishedChallenges: number;
    activeChallenges: number;
    completedChallenges: number;
    totalParticipants: number;
    totalSubmissions: number;
    featuredChallenges: number;
  };
  byCategory: Array<{
    _id: string;
    count: number;
    avgParticipants: number;
    avgSubmissions: number;
  }>;
  byDifficulty: Array<{
    _id: string;
    count: number;
    avgParticipants: number;
    avgSubmissions: number;
  }>;
  recentActivity: Challenge[];
}

export const challengeService = {
  // Create new challenge
  createChallenge: async (challengeData: any): Promise<Challenge> => {
    return retryRequest(async () => {
      const response = await axios.post(`${API_URL}/api/admin/challenges`, challengeData, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  // Get all challenges
  getAllChallenges: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{ data: Challenge[]; pagination: any }> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/challenges`, {
        params,
        headers: getAuthHeaders(),
      });
      return response.data;
    });
  },

  // Get challenge by ID
  getChallengeById: async (id: string): Promise<Challenge> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/challenges/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  // Update challenge
  updateChallenge: async (id: string, challengeData: Partial<Challenge>): Promise<Challenge> => {
    return retryRequest(async () => {
      const response = await axios.put(`${API_URL}/api/admin/challenges/${id}`, challengeData, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  // Delete challenge
  deleteChallenge: async (id: string): Promise<void> => {
    return retryRequest(async () => {
      await axios.delete(`${API_URL}/api/admin/challenges/${id}`, {
        headers: getAuthHeaders(),
      });
    });
  },

  // Get challenge statistics
  getChallengeStats: async (): Promise<ChallengeStats> => {
    return retryRequest(async () => {
      const response = await axios.get(`${API_URL}/api/admin/challenges/stats`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    });
  },

  // Get challenge submissions
  getChallengeSubmissions: async (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; pagination: any }> => {
    const response = await axios.get(`${API_URL}/api/admin/challenges/${id}/submissions`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Review submission
  reviewSubmission: async (challengeId: string, submissionId: string, reviewData: {
    status: string;
    score: number;
    feedback: string;
  }): Promise<any> => {
    const response = await axios.put(
      `${API_URL}/api/admin/challenges/${challengeId}/submissions/${submissionId}/review`,
      reviewData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data.data;
  },

  // Select winners
  selectWinners: async (challengeId: string, winners: Array<{
    position: number;
    userId: string;
  }>): Promise<Challenge> => {
    const response = await axios.post(
      `${API_URL}/api/admin/challenges/${challengeId}/select-winners`,
      { winners },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data.data;
  },
};
