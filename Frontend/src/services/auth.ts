// /Frontend/src/services/auth.ts
import { User } from '../context/UserContext';
import {api} from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  // Token management
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (err) {
      // Cannot access localStorage (SSR or private mode)
      return null;
    }
  },

  setToken: (token: string | null): void => {
    try {
      if (token) {
        // Save token safely
        try {
          localStorage.setItem(TOKEN_KEY, token);
        } catch (err) {
          // Handle localStorage access error
        }

        // Set axios Authorization header safely
        if (api?.defaults?.headers) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } else {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch (err) {}
        if (api?.defaults?.headers) {
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      // Unable to save token
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (err) {}
      if (api?.defaults?.headers) {
        delete api.defaults.headers.common['Authorization'];
      }
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (err) {}
    if (api?.defaults?.headers) {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // User management
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr) {
        return null;
      }

      return JSON.parse(userStr);
    } catch (error) {
      // Clear invalid user data
      try {
        localStorage.removeItem(USER_KEY);
      } catch (err) {}
      return null;
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      // Handle localStorage error
    }
  },

  clearUser: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (err) {}
  },

  // Authentication state
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  // Login/Logout
  login: (token: string, user: User): void => {
    authService.setToken(token);
    // Store user data in localStorage
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      // Handle localStorage error
    }
  },

  logout: (): void => {
    authService.setToken('');
    try {
      localStorage.removeItem(USER_KEY);
    } catch (err) {}
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
