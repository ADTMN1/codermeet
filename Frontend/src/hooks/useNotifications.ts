import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../context/UserContext';
import { SOCKET_URL } from '../config/api';

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

    // Initialize socket connection with better error handling
    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('auth_token') },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Join notification room
    socket.on('connect', () => {
      console.log('Connected to notification server');
      socket.emit('join-notifications');
    });

    // Listen for new notifications
    socket.on('new-notification', (notification: Notification) => {
      // Update notification count in sidebar
      const event = new CustomEvent('new-notification', {
        detail: notification
      });
      window.dispatchEvent(event);
    });

    // Handle connection errors with better logging
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: (error as any).description,
        context: (error as any).context,
        type: (error as any).type
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        socket.connect();
      }
    });

    // Handle reconnection attempts
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect... (${attemptNumber})`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Successfully reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to notification server');
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
