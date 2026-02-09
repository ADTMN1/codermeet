import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../context/UserContext';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'message' | 'connection_request' | 'achievement' | 'challenge' | 'system';
  sender?: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket connection
    const token = localStorage.getItem('auth_token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Join notification room
    socket.on('connect', () => {
      console.log('Connected to notification server');
      socket.emit('join-notifications');
    });

    // Listen for new notifications
    socket.on('new-notification', (notification: Notification) => {
      console.log('New real-time notification:', notification);
      
      // Update notification count in sidebar
      const event = new CustomEvent('new-notification', {
        detail: notification
      });
      window.dispatchEvent(event);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id
        });
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  return null;
};
