const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500]
  },
  type: {
    type: String,
    enum: ['public', 'private', 'team', 'direct', 'channel', 'group'],
    default: 'public'
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'manage_members', 'pin_messages', 'manage_room'],
      default: 'read'
    }],
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: {
      type: Date,
      default: null
    }
  }],
  maxMembers: {
    type: Number,
    min: 2,
    max: 1000,
    default: 100
  },
  currentMembers: {
    type: Number,
    default: 0
  },
  isJoinable: {
    type: Boolean,
    default: true
  },
  joinRequirements: {
    type: String,
    enum: ['none', 'approval', 'invite_only', 'password'],
    default: 'none'
  },
  joinPassword: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30]
  }],
  category: {
    type: String,
    enum: ['general', 'tech', 'project', 'random', 'support', 'announcements'],
    default: 'general'
  },
  language: {
    type: String,
    enum: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese'],
    default: 'english'
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  settings: {
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    allowVoiceMessages: {
      type: Boolean,
      default: true
    },
    allowVideoCalls: {
      type: Boolean,
      default: true
    },
    allowScreenSharing: {
      type: Boolean,
      default: false
    },
    messageRetention: {
      type: Number,
      default: 30 // days
    },
    autoDeleteMessages: {
      type: Boolean,
      default: false
    },
    enableSlowMode: {
      type: Boolean,
      default: false
    },
    customWelcomeMessage: {
      type: String,
      default: null
    }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator'],
      default: 'moderator'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    peakOnline: {
      type: Number,
      default: 0
    }
  },
  pinnedMessages: [{
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  welcomeMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Enhanced virtuals
chatRoomSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

chatRoomSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

chatRoomSchema.virtual('onlineMemberCount').get(function() {
  return this.members ? this.members.filter(member => member.isOnline).length : 0;
});

chatRoomSchema.virtual('isFull').get(function() {
  return this.currentMembers >= this.maxMembers;
});

chatRoomSchema.virtual('availability').get(function() {
  if (this.isArchived) return 'archived';
  if (this.isFull) return 'full';
  if (!this.isJoinable) return 'closed';
  return 'open';
});

chatRoomSchema.virtual('formattedTags').get(function() {
  if (!this.tags || this.tags.length === 0) return [];
  return this.tags.map(tag => ({
    name: tag,
    color: this.getTagColor(tag)
  }));
});

// Method to get tag color
chatRoomSchema.methods.getTagColor = function(tag) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[Math.abs(hash) % colors.length];
};

// Indexes for performance
chatRoomSchema.index({ type: 1, category: 1 });
chatRoomSchema.index({ 'members.userId': 1 });
chatRoomSchema.index({ ownerId: 1 });
chatRoomSchema.index({ isArchived: 1 });
chatRoomSchema.index({ lastActivity: -1 });
chatRoomSchema.index({ tags: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
