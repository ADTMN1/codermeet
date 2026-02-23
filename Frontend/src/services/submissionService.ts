// services/submissionService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface SubmissionData {
  githubUrl: string;
  description: string;
  files?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}

export interface Submission {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    avatar?: string;
  };
  challengeId: string;
  challengeTitle: string;
  challengeType: 'weekly' | 'daily';
  challengeCategory: string;
  challengeDifficulty: string;
  status: string;
  submittedAt: string;
  githubUrl?: string;
  liveUrl?: string;
  description?: string;
  screenshots?: string[];
  score: number;
  code?: string;
  language?: string;
  testResults?: any[];
  completionTime?: any;
  hintsUsed?: number;
  reviewedBy?: {
    _id: string;
    fullName: string;
    username: string;
  };
  reviewedAt?: string;
  feedback?: string;
}

class SubmissionService {
  // Submit project for a challenge
  async submitProject(challengeId: string, submissionData: SubmissionData, challengeType: 'regular' | 'weekly' = 'regular'): Promise<{ success: boolean; data: Submission; message: string }> {
    try {
      const endpoint = challengeType === 'weekly' ? 'weekly-challenges' : 'challenges';
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/${endpoint}/${challengeId}/submit`,
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit project');
    }
  }

  // Get user's submissions for a challenge
  async getUserSubmission(challengeId: string, challengeType: 'regular' | 'weekly' = 'regular'): Promise<Submission | null> {
    try {
      const endpoint = challengeType === 'weekly' ? 'weekly-challenges' : 'challenges';
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/${endpoint}/${challengeId}/my-submission`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      // Only log unexpected errors, not 404s
      if (error.response?.status !== 404) {
        console.error('Unexpected error fetching submission:', error);
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  }

  // Get all submissions for a challenge (admin only)
  async getChallengeSubmissions(challengeId: string, status?: string): Promise<{ data: Submission[]; pagination: any }> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/weekly-challenges/${challengeId}/submissions`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }

  // Get all submissions across all challenges (admin only)
  async getAllSubmissions(params?: { status?: string; challengeType?: string }): Promise<{ data: Submission[]; pagination: any; stats?: any }> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/submissions`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all submissions');
    }
  }

  // Review a submission (admin only)
  async reviewSubmission(submissionId: string, reviewData: {
    status: 'accepted' | 'rejected';
    score?: number;
    feedback?: string;
    rankingCriteria?: {
      codeQuality?: number;
      functionality?: number;
      creativity?: number;
      documentation?: number;
    };
    rank?: string;
    content?: any;
  }): Promise<Submission> {
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/submissions/${submissionId}/review`,
        reviewData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to review submission');
    }
  }
}

export const submissionService = new SubmissionService();
