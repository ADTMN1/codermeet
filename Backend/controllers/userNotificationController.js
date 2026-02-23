const Notification = require('../models/notification');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;
    
    const notifications = await Notification.getUserNotifications(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true'
    });
    
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
        read: notification.read,
        priority: notification.metadata?.priority || 'medium',
        userName: notification.sender?.fullName,
        userEmail: notification.sender?.email
      })),
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching notifications",
      error: error.message 
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error marking notification as read",
      error: error.message 
    });
  }
};

// Mark all notifications as read for user
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error marking all notifications as read",
      error: error.message 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.deleteNotification(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error deleting notification",
      error: error.message 
    });
  }
};
