// /Frontend/src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './auth';
import { User } from '../context/UserContext';
import { uploadToCloudinary } from './cloudinary';

interface ApiResponse<T = any> {
  data?: T;
  error?: { message: string; code?: string };
  success: boolean;
  message?: string;
  token?: string; // Add token for login response
}

interface LoginResponse {
  token: string;
  user: User;
}

const API_ROUTES = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  me: '/users/me',
  profile: '/users/profile',
  profileAvatar: '/users/profile/avatar',
  checkUser: '/users/check-user',
};

// Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(handleError(error))
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

// Centralized error handler
function handleError(error: any): Error {
  if (error.response) {
    const { status, data } = error.response;
    if (data?.message) return new Error(data.message);
    if (status === 404) return new Error('Resource not found');
    if (status === 403) return new Error('You do not have permission to perform this action');
    if (status >= 500) return new Error('Server error. Please try again later.');
    return new Error(`Request failed with status ${status}`);
  }
  if (error.request) {
    if (error.code === 'ECONNABORTED') return new Error('Request timeout. Please try again.');
    return new Error('No response from server. Please check your internet connection.');
  }
  return error instanceof Error ? error : new Error('An unknown error occurred');
}

// API service
export const apiService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<User>>(API_ROUTES.login, { email, password });
    const apiResponse = response.data;
    const token = apiResponse.token!;
    const user = apiResponse.data!; // Backend returns user data in 'data' field
    
    if (token && user) authService.login(token, user);
    return { token, user };
  },

  register: async (userData: Omit<User, '_id' | 'points'> & { password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<{ user: User }>>(API_ROUTES.register, userData);
    return response.data.data!.user;
  },

  logout: async (): Promise<void> => {
    await api.post(API_ROUTES.logout);
    authService.logout();
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>(API_ROUTES.me);
    const userData = response.data.data?.user || response.data.data;
    if (!userData) throw new Error('No user data found in response');
    return userData as User;
  },

  updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
    const config: AxiosRequestConfig = { headers: {} };
    if (data instanceof FormData && config.headers) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.put<ApiResponse<{ user: User }>>(API_ROUTES.profile, data, config);
    const userData = response.data.data?.user;
    if (!userData) throw new Error('No user data received from server after update');
    return userData;
  },

  updateProfilePicture: async (file?: File): Promise<User> => {
    // ✅ safety check
    if (!file) throw new Error('No file provided');

    if (!file.type?.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Upload file directly to backend (backend will handle Cloudinary)
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.put<ApiResponse<{ user: User }>>(API_ROUTES.profileAvatar, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const userData = response.data.data?.user;
    if (!userData) throw new Error('No user data received from server after avatar update');
    return userData;
  },

  uploadImage: async (file: File): Promise<string> => {
    if (!file) throw new Error('No file provided');
    return uploadToCloudinary(file);
  },

  checkUser: async (field: 'email' | 'username', value: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ exists: boolean }>>(API_ROUTES.checkUser, {
      params: { field, value },
    });
    return response.data.data?.exists || false;
  },

  
};

export default apiService;
export { api };

