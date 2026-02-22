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
  githubUrl: string;
  description: string;
  files: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  score?: number;
  feedback?: string;
  reviewedBy?: {
    _id: string;
    fullName: string;
    username: string;
  };
  reviewedAt?: string;
}

class SubmissionService {
  // Submit project for a challenge
  async submitProject(challengeId: string, submissionData: SubmissionData): Promise<{ success: boolean; data: Submission; message: string }> {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/weekly-challenges/${challengeId}/submit`,
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
  async getUserSubmission(challengeId: string): Promise<Submission | null> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/weekly-challenges/${challengeId}/my-submission`,
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
  async getAllSubmissions(status?: string): Promise<{ data: Submission[]; pagination: any }> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/weekly-challenges/submissions/all`,
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
  async reviewSubmission(challengeId: string, submissionId: string, reviewData: {
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
  }): Promise<Submission> {
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/weekly-challenges/${challengeId}/submissions/${submissionId}/review`,
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
