// context/UserContext.tsx
import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { authService } from '../services/auth';
import { sessionManager } from '../services/sessionManager';
import { userPreferencesService } from '../services/userPreferences';

export interface User {
  _id?: string;
  id?: string; // Add id field for backward compatibility
  name: string;
  fullName?: string;
  email: string;
  username?: string;
  plan?: string;
  role?: string;
  avatar?: string; // Use only one field consistently
  profilePicture?: string; // Add profilePicture for backward compatibility
  phone?: string;
  points?: number;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
  isProfessional?: boolean; // Add missing property
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void; // Add this function
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && (parsedUser._id || parsedUser.email)) {
          return {
            name: parsedUser.fullName || parsedUser.name || '',
            email: parsedUser.email || '',
            avatar: parsedUser.avatar || parsedUser.profilePicture || parsedUser.profileImage || '',
            profilePicture: parsedUser.profilePicture || parsedUser.avatar || parsedUser.profileImage || '',
            bio: parsedUser.bio || '',
            location: parsedUser.location || '',
            website: parsedUser.website || '',
            github: parsedUser.github || '',
            linkedin: parsedUser.linkedin || '',
            skills: parsedUser.skills || [],
            points: parsedUser.points || 0,
            username: parsedUser.username || '',
            ...parsedUser // Spread last to ensure our mapping takes precedence
          };
        }
      }
    } catch (error) {
      // Error parsing saved user data, clear it
      localStorage.removeItem('user_data');
    }
    return null;
  });

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  // Sync with auth service
  const setUser = useCallback((newUser: User | null) => {
    if (newUser) {
      const completeUser = {
        ...newUser, // Spread first to preserve all properties
        name: newUser.fullName || newUser.name || '',
        email: newUser.email || '',
        avatar: newUser.avatar || newUser.profilePicture || '',
        profilePicture: newUser.profilePicture || newUser.avatar || '',
        bio: newUser.bio || '',
        location: newUser.location || '',
        website: newUser.website || '',
        github: newUser.github || '',
        linkedin: newUser.linkedin || '',
        skills: newUser.skills || [],
        points: newUser.points || 0,
        username: newUser.username || ''
      };
      
      setUserState(completeUser);
      authService.setUser(completeUser);
    } else {
      setUserState(null);
      authService.clearUser();
    }
  }, []);

  // Add updateUser function for partial updates
  const updateUser = useCallback((updates: Partial<User>) => {
    setUserState(prev => {
      if (!prev) return null;
      
      const updatedUser = {
        ...prev,
        ...updates,
        // Ensure both avatar and profilePicture fields are kept in sync
        avatar: updates.avatar !== undefined ? updates.avatar : (updates.profilePicture !== undefined ? updates.profilePicture : prev.avatar),
        profilePicture: updates.profilePicture !== undefined ? updates.profilePicture : (updates.avatar !== undefined ? updates.avatar : prev.profilePicture)
      };
      
      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      authService.setUser(updatedUser);
      
      return updatedUser;
    });
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUserState(null);
    authService.logout();
    sessionManager.clearSessions();
    // Clean up user-specific preferences
    userPreferencesService.cleanupOldAppearanceSettings();
  }, []);
  

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};