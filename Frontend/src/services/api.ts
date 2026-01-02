// /Frontend/src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './auth';
import { User } from '../context/UserContext';
import { uploadToCloudinary } from './cloudinary';
// Types for API responses
interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
  message?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000', // Explicitly set for development
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(handleError(error));
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.data && !response.data.success) {
      return Promise.reject(handleError(response.data.error));
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(handleError(error));
  }
);

// Error handling helper
function handleError(error: any): Error {
  if (error.response) {
    // The request was made and the server responded with a status code
    if (error.response.data && typeof error.response.data === 'object') {
      if (error.response.data.message) {
        return new Error(error.response.data.message);
      }
    }
    
    if (error.response.status >= 500) {
      return new Error('Server error. Please try again later.');
    }
    
    if (error.response.status === 404) {
      return new Error('Resource not found');
    }
    
    if (error.response.status === 403) {
      return new Error('You do not have permission to perform this action');
    }
    
    return new Error(`Request failed with status ${error.response.status}`);
  } 
  
  if (error.request) {
    // The request was made but no response was received
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }
    
    return new Error('No response from server. Please check your internet connection.');
  }
  
  // Something happened in setting up the request
  return error instanceof Error ? error : new Error('An unknown error occurred');
}

// API methods
export const apiService = {
  // Auth
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password });
      if (response.data.data?.token && response.data.data?.user) {
        authService.login(response.data.data.token, response.data.data.user);
      }
      return response.data.data!;
    } catch (error) {
      throw handleError(error);
    }
  },

  register: async (userData: Omit<User, '_id' | 'points'> & { password: string }): Promise<User> => {
    try {
      const response = await api.post<ApiResponse<{ user: User }>>('/api/auth/register', userData);
      return response.data.data!.user;
    } catch (error) {
      throw handleError(error);
    }
  },

  updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
    try {
      const config: AxiosRequestConfig = {
        headers: {}
      };
      
      if (data instanceof FormData) {
        config.headers = {
          ...config.headers,
          'Content-Type': 'multipart/form-data'
        };
      }
      
      const response = await api.put<ApiResponse<{ user: User }>>('/api/auth/profile', data, config);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }
      
      const userData = response.data.data?.user;
      
      if (!userData) {
        throw new Error('No user data received');
      }
      
      const processedUser: User = {
        _id: userData._id,
        name: userData.fullName || userData.name || '',
        email: userData.email,
        username: userData.username,
        avatar: userData.avatar,
        bio: userData.bio || '',
        location: userData.location || '',
        website: userData.website || '',
        github: userData.github || '',
        linkedin: userData.linkedin || '',
        skills: userData.skills || [],
        points: userData.points || 0,
      };
      
      return processedUser;
    } catch (error) {
      throw handleError(error);
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
      
      if (!response.data.success || !response.data.data?.user) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
      
      return response.data.data.user;
    } catch (error) {
      throw handleError(error);
    }
  },

  uploadImage: async (file: File): Promise<string> => {
    return await uploadToCloudinary(file);
  },

  updateProfilePicture: async (imageUrl: string) => {
    const response = await api.put('/api/auth/profile', { profilePicture: imageUrl });
    return response.data;
  }
};

export default api;