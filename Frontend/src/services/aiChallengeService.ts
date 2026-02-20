// AI Challenge Service
import { API_URL } from '../config/api';

export interface GenerationOptions {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  timeLimit?: number;
  maxPoints?: number;
  topic?: string;
}

export interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: string;
  category: string;
  timeLimit: number;
  maxPoints: number;
  hint: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    weight: number;
  }>;
  scoringCriteria: {
    correctness: { weight: number; description: string };
    speed: { weight: number; description: string };
    efficiency: { weight: number; description: string };
  };
  prizes: {
    first: { amount: number; type: string; currency: string };
    second: { amount: number; type: string; currency: string };
    third: { amount: number; type: string; currency: string };
  };
  tags: string[];
  solutionApproach: string;
}

export interface GenerationStats {
  totalGenerated: number;
  successRate: number;
  avgGenerationTime: number;
  mostUsedCategory: string;
  mostUsedDifficulty: string;
}

class AIChallengeService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Generate challenge preview
  async generateChallenge(options: GenerationOptions = {}): Promise<{
    success: boolean;
    data: GeneratedChallenge;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/generate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate challenge');
      }
      
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate challenge');
    }
  }

  // Generate and save challenge immediately
  async generateAndCreateChallenge(options: GenerationOptions = {}): Promise<{
    success: boolean;
    data: GeneratedChallenge;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/generate-and-create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate and save challenge');
      }
      
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate and create challenge');
    }
  }

  // Generate weekly challenges
  async generateWeeklyChallenges(options: {
    startDate?: string;
    difficulties?: string[];
  } = {}): Promise<{
    success: boolean;
    data: any[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/generate-weekly`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate weekly challenges');
      }
      
      return data;
    } catch (error) {
      console.error('Error generating weekly challenges:', error);
      throw error;
    }
  }

  // Generate topic-specific challenge
  async generateTopicChallenge(topic: string, difficulty: string = 'Medium'): Promise<{
    success: boolean;
    data: GeneratedChallenge;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/generate-topic`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ topic, difficulty })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate topic challenge');
      }
      
      return data;
    } catch (error) {
      console.error('Error generating topic challenge:', error);
      throw error;
    }
  }

  // Auto-generate challenges for N days
  async autoGenerateChallenges(daysAhead: number = 7): Promise<{
    success: boolean;
    data: any[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/auto-generate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ daysAhead })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to auto-generate challenges');
      }
      
      return data;
    } catch (error) {
      console.error('Error auto-generating challenges:', error);
      throw error;
    }
  }

  // Preview challenge before saving
  async previewChallenge(options: GenerationOptions = {}): Promise<{
    success: boolean;
    data: GeneratedChallenge;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/preview`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to preview challenge');
      }
      
      return data;
    } catch (error) {
      console.error('Error previewing challenge:', error);
      throw error;
    }
  }

  // Get generation statistics
  async getGenerationStats(): Promise<{
    success: boolean;
    data: GenerationStats;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/stats`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get generation stats');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting generation stats:', error);
      throw error;
    }
  }

  // Bulk generate for date range
  async bulkGenerate(startDate: string, endDate: string, options: GenerationOptions = {}): Promise<{
    success: boolean;
    data: any[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/admin/challenges/bulk-generate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ startDate, endDate, ...options })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to bulk generate challenges');
      }
      
      return data;
    } catch (error) {
      console.error('Error bulk generating challenges:', error);
      throw error;
    }
  }
}

export const aiChallengeService = new AIChallengeService();
