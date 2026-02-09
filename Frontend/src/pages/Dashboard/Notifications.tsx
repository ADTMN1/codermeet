import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaTimes, FaEnvelope, FaUserPlus, FaTrophy, FaCode } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

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

const Notifications: React.FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Initialize real-time notifications
  useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Listen for real-time notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail as Notification;
      
      // Add to notifications list if not already present
      setNotifications(prev => {
        const exists = prev.some(n => n._id === newNotification._id);
        if (!exists) {
          return [newNotification, ...prev];
        }
        return prev;
      });
    };

    window.addEventListener('new-notification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const token = localStorage.getItem('auth_token');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(prev => prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/notifications/read-all`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setDeleting(notificationId);
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/notifications/${notificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <FaEnvelope className="text-blue-400" />;
      case 'connection_request':
        return <FaUserPlus className="text-green-400" />;
      case 'achievement':
        return <FaTrophy className="text-yellow-400" />;
      case 'challenge':
        return <FaCode className="text-purple-400" />;
      default:
        return <FaBell className="text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <FaCheck />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
              <p className="text-gray-400">You're all caught up! Check back later for new notifications.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-gray-800 rounded-xl border transition-all duration-300 ${
                  !notification.read 
                    ? 'border-purple-500/50 bg-purple-900/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Sender info */}
                          {notification.sender && (
                            <div className="flex items-center gap-2 mb-2">
                              {notification.sender.avatar ? (
                                <img
                                  src={notification.sender.avatar}
                                  alt={notification.sender.fullName}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {notification.sender.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-400">
                                {notification.sender.fullName} (@{notification.sender.username})
                              </span>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{formatDate(notification.createdAt)}</span>
                            {!notification.read && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              disabled={markingAsRead === notification._id}
                              className="p-2 text-gray-400 hover:text-white transition disabled:opacity-50"
                              title="Mark as read"
                            >
                              {markingAsRead === notification._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FaCheck />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            disabled={deleting === notification._id}
                            className="p-2 text-gray-400 hover:text-red-400 transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === notification._id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
