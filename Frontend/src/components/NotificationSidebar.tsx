import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, X, Check, Trash2, User, Upload, Award, Calendar, AlertTriangle, Shield, BarChart3 } from 'lucide-react';
import { SOCKET_URL } from '../config/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userName?: string;
  userEmail?: string;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const NotificationSidebar: React.FC<NotificationSidebarProps> = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        let token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        
        console.log('🔔 Fetching notifications with token:', token ? 'present' : 'missing');
        
        const response = await fetch('/api/admin/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Fetched data:', data);
          console.log('🔔 Unread count from backend:', data.unreadCount);
          console.log('🔔 Notifications array length:', data.notifications?.length);
          
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          onUnreadCountChange?.(data.unreadCount || 0);
          
          console.log('🔔 Called onUnreadCountChange with:', data.unreadCount || 0);
        } else {
          console.error('Failed to fetch notifications:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up Socket.IO for real-time updates
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      }
    });
    
    socket.on('connect', () => {
      console.log('Connected to notification server');
      // Join notification room
      socket.emit('join-notifications');
    });

    socket.on('new-notification', (data) => {
      try {
        // Handle notification from backend
        const notification = data.notification || data;
        setNotifications(prev => [notification, ...prev]);
        const newUnreadCount = unreadCount + 1;
        setUnreadCount(newUnreadCount);
        onUnreadCountChange?.(newUnreadCount);
      } catch (error) {
        console.error('Socket.IO message error:', error);
      }
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      user_signup: <User className="w-4 h-4 text-blue-400" />,
      project_submission: <Upload className="w-4 h-4 text-green-400" />,
      challenge_submission: <Upload className="w-4 h-4 text-orange-400" />,
      business_idea: <Award className="w-4 h-4 text-purple-400" />,
      challenge_creation: <Calendar className="w-4 h-4 text-orange-400" />,
      system_alert: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
      security_alert: <Shield className="w-4 h-4 text-red-400" />,
      no_scheduled_challenges: <AlertTriangle className="w-4 h-4 text-red-400" />,
      urgent_alert: <AlertTriangle className="w-4 h-4 text-red-400" />,
      daily_digest: <BarChart3 className="w-4 h-4 text-purple-400" />,
      weekly_report: <BarChart3 className="w-4 h-4 text-green-400" />
    };
    return iconMap[type] || <Bell className="w-4 h-4 text-gray-400" />;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: 'border-l-green-500',
      medium: 'border-l-yellow-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500'
    };
    return colorMap[priority] || 'border-l-gray-500';
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'unread') {
      return notifications.filter((n: Notification) => !n.read);
    }
    return notifications;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = async (id: string) => {
    try {
      // Call backend API to mark as read
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        
        // Update unread count
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        onUnreadCountChange?.(newUnreadCount);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('🔔 Marking all notifications as read...');
      
      // Call backend API to mark all as read
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔔 API Response status:', response.status);
      
      if (response.ok) {
        console.log('🔔 API call successful, updating local state...');
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        onUnreadCountChange?.(0);
        
        console.log('🔔 Local state updated - unread count set to 0');
      } else {
        console.error('🔔 API call failed:', response.statusText);
      }
    } catch (error) {
      console.error('🔔 Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const deletedNotification = notifications.find(n => n.id === id);
    if (deletedNotification && !deletedNotification.read) {
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      onUnreadCountChange?.(newUnreadCount);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-800 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-800 text-white-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white border-b-2 border-transparent'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'unread' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white border-b-2 border-transparent'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              getFilteredNotifications().map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                    getPriorityColor(notification.priority)
                  } ${!notification.read ? 'bg-gray-800/50' : ''} hover:bg-gray-800`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          {notification.userName && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.userName} {notification.userEmail && `(${notification.userEmail})`}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              notification.priority === 'urgent' ? 'bg-red-500 text-white' :
                              notification.priority === 'high' ? 'bg-orange-500 text-white' :
                              notification.priority === 'medium' ? 'bg-blue-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationSidebar;
