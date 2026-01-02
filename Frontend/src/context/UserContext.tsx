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

export interface User {
  _id?: string;
  name: string;
  fullName?: string;
  email: string;
  username?: string;
  plan?: string;
  avatar?: string;
  phone?: string;
  points?: number;
  profileImage?: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultUser: User = {
  name: '',
  email: '',
  bio: '',
  location: '',
  website: '',
  github: '',
  linkedin: '',
  skills: [],
  points: 0,
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && (parsedUser._id || parsedUser.email)) {
          return {
            ...defaultUser,
            ...parsedUser,
            name: parsedUser.fullName || parsedUser.name || '',
            profilePicture: parsedUser.avatar || parsedUser.profilePicture || parsedUser.profileImage
          };
        }
      }
    } catch (error) {
      // Error parsing saved user data
    }
    return null;
  });

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      const userToStore = {
        ...user,
        fullName: user.fullName || user.name,
        ...defaultUser,
        ...user
      };
      localStorage.setItem('user_data', JSON.stringify(userToStore));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  // Sync with auth service
  const setUser = useCallback((newUser: User | null) => {
    if (newUser) {
      const completeUser = {
        ...defaultUser,
        ...newUser,
        name: newUser.fullName || newUser.name || '',
        fullName: newUser.fullName || newUser.name || '',
        profilePicture: newUser.avatar || newUser.profilePicture || newUser.profileImage
      };
      
      setUserState(completeUser);
      authService.setUser(completeUser);
    } else {
      setUserState(null);
      authService.clearUser();
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, [setUser]);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};