const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000]
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text'
  },
  messageType: {
    type: String,
    enum: ['standard', 'system', 'announcement', 'reaction', 'reply'],
    default: 'standard'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    fullName: String
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'video', 'audio', 'document']
    },
    url: String,
    name: String,
    size: Number,
    mimeType: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Enhanced features
  isPinned: {
    type: Boolean,
    default: false
  },
  isForwarded: {
    type: Boolean,
    default: false
  },
  originalMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  lastDeliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Enhanced virtuals
chatMessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

chatMessageSchema.virtual('formattedContent').get(function() {
  if (this.type === 'text') {
    return this.content;
  } else if (this.type === 'system') {
    return `🔔 ${this.content}`;
  }
  return this.content;
});

chatMessageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
});

chatMessageSchema.virtual('reactionSummary').get(function() {
  if (!this.reactions || this.reactions.length === 0) return null;
  
  const totalReactions = this.reactions.reduce((sum, reaction) => sum + reaction.count, 0);
  const uniqueEmojis = [...new Set(this.reactions.map(r => r.emoji))];
  
  return {
    total: totalReactions,
    emojis: uniqueEmojis.map(emoji => ({
      emoji,
      count: this.reactions.filter(r => r.emoji === emoji).reduce((sum, r) => sum + r.count, 0),
      users: this.reactions.filter(r => r.emoji === emoji).flatMap(r => r.users)
    }))
  };
});

// Indexes for performance
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, createdAt: -1 });
chatMessageSchema.index({ 'replyTo': 1, createdAt: -1 });
chatMessageSchema.index({ 'threadId': 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
