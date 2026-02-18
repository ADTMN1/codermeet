import React, { useState, useEffect } from 'react';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaFilter,
  FaClock,
  FaCheckDouble,
  FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'message' | 'connection_request' | 'achievement' | 'challenge' | 'system' | 'job_application' | 'team_invite' | 'mention' | 'like' | 'comment';
  sender?: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
    role?: string;
  };
  read: boolean;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    senderName?: string;
    senderUsername?: string;
    senderRole?: string;
    senderAvatar?: string;
    originalMessage?: string;
  };
}

type FilterType = 'all' | 'read' | 'unread';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setNotifications(response.data.data || []);
      } else {
        // Mock data for development
        const mockNotifications: Notification[] = [
          {
            _id: '1',
            title: 'New Connection Request',
            message: 'John Doe wants to connect with you on the platform.',
            type: 'connection_request',
            sender: { _id: 'user2', fullName: 'John Doe', username: 'johndoe' },
            read: false,
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
            priority: 'medium'
          },
          {
            _id: '2',
            title: 'Achievement Unlocked!',
            message: 'Congratulations! You\'ve completed the "React Mastery" challenge.',
            type: 'achievement',
            sender: { _id: 'system', fullName: 'CoderMeet', username: 'system' },
            read: false,
            createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
            priority: 'high'
          }
        ];
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      
      // Add new notification to the list
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast
      toast.success(`New ${notification.type}: ${notification.title}`);
    };

    window.addEventListener('new-notification', handleNewNotification);
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);

  // Filter notifications logic
  useEffect(() => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter(n => n.read));
    } else {
      setFilteredNotifications(notifications.filter(n => !n.read));
    }
  }, [notifications, filter]);

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
  };

  const handleClearSelection = () => setSelectedNotifications([]);

  const handleBulkMarkAsRead = async () => {
    // Get all unread notifications
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
      toast.info('No unread notifications to mark as read');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      await Promise.all(unreadNotifications.map(notification => 
        axios.patch(`${API_CONFIG.BASE_URL}/users/notifications/${notification._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('notification-updated'));
      
      toast.success(`${unreadNotifications.length} marked as read`);
      handleClearSelection();
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      const token = localStorage.getItem('auth_token');
      await Promise.all(selectedNotifications.map(id => 
        axios.delete(`${API_CONFIG.BASE_URL}/users/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n._id)));
      
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('notification-updated'));
      
      toast.success('Deleted successfully');
      handleClearSelection();
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      message: '💬', connection_request: '🤝', achievement: '🏆',
      challenge: '🎯', system: '🔔', team_invite: '👥'
    };
    return <span className="w-5 h-5">{icons[type] || '📢'}</span>;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-700 bg-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-purple-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaBell className="text-purple-400 w-6 h-6" />
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">{unreadCount}</span>}
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button onClick={handleBulkMarkAsRead} className="px-4 py-2 bg-purple-600 rounded-lg flex items-center gap-2">
                <FaCheck /> Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {selectedNotifications.length > 0 && (
            <div className="flex gap-2">
              <button onClick={handleBulkMarkAsRead} className="bg-green-600 px-3 py-2 rounded-lg flex items-center gap-2">
                <FaCheckDouble /> Mark Read
              </button>
              <button onClick={handleBulkDelete} className="bg-red-600 px-3 py-2 rounded-lg flex items-center gap-2">
                <FaTrash /> Delete
              </button>
            </div>
          )}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No notifications found.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <input 
                type="checkbox" 
                checked={selectedNotifications.length === filteredNotifications.length} 
                onChange={handleSelectAll} 
              />
              <span className="text-sm">Select All</span>
            </div>

            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`group relative border rounded-xl p-4 transition-all ${
                  notification.read ? 'border-gray-700 bg-gray-800' : getPriorityColor(notification.priority)
                } ${selectedNotifications.includes(notification._id) ? 'ring-2 ring-purple-500' : ''}`}
              >
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={() => handleSelectNotification(notification._id)}
                    className="mt-1"
                  />
                  <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start pr-16">
                      <div>
                        <h3 className="font-semibold text-white">{notification.title}</h3>
                        <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                        
                        {/* Show sender information for message notifications */}
                        {notification.type === 'message' && notification.sender && (
                          <div className="mt-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-center gap-2 mb-1">
                              {notification.sender.avatar && (
                                <img 
                                  src={notification.sender.avatar} 
                                  alt={notification.sender.fullName}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-purple-400">
                                  From: {notification.sender.fullName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  @{notification.sender.username} • {notification.sender.role}
                                </p>
                              </div>
                            </div>
                            
                            {/* Show original message if metadata exists */}
                            {notification.metadata?.originalMessage && (
                              <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-600">
                                <p className="text-xs text-gray-400 mb-1">Original message:</p>
                                <p className="text-sm text-gray-200">"{notification.metadata.originalMessage}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <FaClock /> {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Actions - visible on hover */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {!notification.read && (
                    <button 
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('auth_token');
                          await axios.patch(`${API_CONFIG.BASE_URL}/users/notifications/${notification._id}/read`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
                          toast.success('Marked as read');
                        } catch (error) {
                          toast.error('Failed to mark as read');
                        }
                      }}
                      className="text-green-400 hover:text-green-300 bg-gray-700/50 p-1.5 rounded text-xs"
                      title="Mark as read"
                    >
                      <FaCheckCircle />
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('auth_token');
                        await axios.delete(`${API_CONFIG.BASE_URL}/users/notifications/${notification._id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setNotifications(prev => prev.filter(n => n._id !== notification._id));
                        
                        // Dispatch event to update sidebar count
                        window.dispatchEvent(new CustomEvent('notification-updated'));
                        
                        toast.success('Deleted');
                      } catch (error) {
                        toast.error('Failed to delete notification');
                      }
                    }}
                    className="text-red-400 hover:text-red-300 bg-gray-700/50 p-1.5 rounded text-xs"
                    title="Delete notification"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;