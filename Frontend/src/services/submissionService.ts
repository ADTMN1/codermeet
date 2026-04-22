// services/submissionService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface SubmissionData {
  githubUrl: string;
  liveUrl?: string;
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
      console.log('=== FRONTEND SUBMISSION REVIEW DEBUGGING ===');
      console.log('1. reviewSubmission called with:', {
        submissionId,
        submissionIdType: typeof submissionId,
        submissionIdLength: submissionId?.length,
        reviewData: JSON.stringify(reviewData, null, 2)
      });
      
      // Get auth token
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      console.log('2. Auth token:', token ? 'present' : 'missing');
      console.log('3. Token length:', token?.length);
      
      // Prepare request
      const requestUrl = `${API_CONFIG.BASE_URL}/submissions/${submissionId}/review`;
      console.log('4. Request URL:', requestUrl);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      console.log('5. Request headers:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers.Authorization ? 'Bearer [TOKEN_PRESENT]' : 'Bearer [MISSING]'
      });
      
      console.log('6. About to make PUT request...');
      
      const response = await axios.put(
        requestUrl,
        reviewData,
        { headers }
      );
      
      console.log('7. Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      if (!response.data || !response.data.data) {
        console.log('8. ERROR: Invalid response structure');
        console.log('9. Response data:', response.data);
        throw new Error('Invalid response structure');
      }
      
      console.log('10. Submission review successful');
      console.log('11. Updated submission:', {
        id: response.data.data._id,
        status: response.data.data.status,
        score: response.data.data.score
      });
      console.log('=== FRONTEND SUBMISSION REVIEW SUCCESS ===');
      
      return response.data.data;
    } catch (error: any) {
      console.error('=== FRONTEND SUBMISSION REVIEW ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.response?.status);
      console.error('Error status text:', error.response?.statusText);
      console.error('Error data:', error.response?.data);
      console.error('Error config:', error.config);
      console.error('Full error:', error);
      console.error('=== END FRONTEND ERROR DEBUGGING ===');
      
      // Extract more detailed error information
      let errorMessage = error.message || 'Failed to review submission';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = `Validation errors: ${JSON.stringify(error.response.data.errors)}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed - you may not have admin privileges';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied - you may not have admin privileges';
      } else if (error.response?.status === 404) {
        errorMessage = 'Submission not found - it may have been deleted or moved';
      } else if (error.response?.status === 400) {
        errorMessage = `Bad request - ${error.response?.data?.message || 'Invalid data provided'}`;
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const submissionService = new SubmissionService();
