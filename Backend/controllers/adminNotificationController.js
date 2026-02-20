const Notification = require('../models/notification');
const User = require('../models/user');

// Get all notifications for admin (system-wide notifications)
exports.getAdminNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;
    
    // For admin, get all system notifications or notifications sent to admin users
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(user => user._id);
    
    const query = { 
      recipient: { $in: adminIds },
      type: { $in: ['system', 'challenge', 'achievement'] }
    };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'fullName username avatar')
      .populate('recipient', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const unreadCount = await Notification.countDocuments({ 
      ...query, 
      read: false 
    });
    
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
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching notifications",
      error: error.message 
    });
  }
};

// Create system notification (admin only)
exports.createSystemNotification = async (req, res) => {
  try {
    const { title, message, type = 'system', priority = 'medium', recipients } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }
    
    // If no specific recipients, send to all admin users
    let recipientIds = recipients;
    if (!recipients || recipients.length === 0) {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      recipientIds = adminUsers.map(user => user._id);
    }
    
    const notifications = [];
    
    for (const recipientId of recipientIds) {
      const notification = await Notification.createNotification({
        recipient: recipientId,
        sender: req.user.id,
        title,
        message,
        type,
        metadata: { priority }
      });
      
      notifications.push(notification);
    }
    
    // Get Socket.IO instance to emit real-time notifications
    const io = req.app.get('io');
    if (io) {
      for (const notification of notifications) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'fullName username avatar')
          .populate('recipient', 'fullName username avatar');
        
        io.to(`user_${notification.recipient}`).emit('new-notification', populatedNotification);
      }
    }
    
    res.status(201).json({
      success: true,
      message: "System notifications created successfully",
      data: notifications
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error creating notification",
      error: error.message 
    });
  }
};

// Mark notification as read (admin)
exports.markAdminNotificationAsRead = async (req, res) => {
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
    res.status(500).json({ 
      success: false, 
      message: "Server error marking notification as read",
      error: error.message 
    });
  }
};

// Mark all admin notifications as read
exports.markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error marking notifications as read",
      error: error.message 
    });
  }
};

// Delete notification (admin)
exports.deleteAdminNotification = async (req, res) => {
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
    res.status(500).json({ 
      success: false, 
      message: "Server error deleting notification",
      error: error.message 
    });
  }
};
