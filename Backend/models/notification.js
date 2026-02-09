const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['message', 'connection_request', 'achievement', 'challenge', 'system'],
    required: true,
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { limit = 50, skip = 0, unreadOnly = false } = options;
  
  const query = { recipient: userId };
  if (unreadOnly) {
    query.read = false;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sender', 'fullName username avatar')
    .exec();
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  ).populate('sender', 'fullName username avatar')
    .exec();
};

// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  ).exec();
};

// Static method to delete notification
notificationSchema.statics.deleteNotification = function(notificationId, userId) {
  return this.findOneAndDelete({ _id: notificationId, recipient: userId })
    .exec();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false })
    .exec();
};

// Instance method to safely delete
notificationSchema.methods.safeDelete = function() {
  return this.constructor.deleteNotification(this._id, this.recipient);
};

module.exports = mongoose.model('Notification', notificationSchema);
