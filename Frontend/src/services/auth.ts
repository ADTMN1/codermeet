// /Frontend/src/services/auth.ts
import { User } from '../context/UserContext';
import api from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  // Token management
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (token) {
      try {
        // Remove 'Bearer ' prefix if it exists to avoid duplication
        const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
        localStorage.setItem(TOKEN_KEY, cleanToken);
        
        // Set the Authorization header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
      } catch (error) {
        throw new Error('Failed to save authentication token');
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  },

  // User management
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      // Clear invalid user data
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  // Authentication state
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  // Login/Logout
  login: (token: string, user: User): void => {
    authService.setToken(token);
    // Store user data in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout: (): void => {
    authService.setToken('');
    localStorage.removeItem(USER_KEY);
  }
};

// Initialize auth service
const token = authService.getToken();

if (token) {
  try {
    authService.setToken(token);
  } catch (error) {
    // Silently handle error - user will need to log in again
  }
}