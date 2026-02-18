const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['web-development', 'mobile-app', 'data-science', 'machine-learning', 'ai', 'blockchain', 'iot', 'game-dev', 'other'],
    default: 'other'
  },
  techStack: [{
    type: String,
    trim: true
  }],
  githubUrl: {
    type: String,
    trim: true
  },
  liveUrl: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'published'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  completionDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ status: 1, featured: -1 });
projectSchema.index({ category: 1 });
projectSchema.index({ 'likes.user': 1 });

// Virtual for like count
projectSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
projectSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Pre-save middleware to update timestamps
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get projects by user
projectSchema.statics.getByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where({ status: options.status });
  }
  
  if (options.featured !== undefined) {
    query.where({ featured: options.featured });
  }
  
  return query.sort({ createdAt: -1 });
};

// Static method to get featured projects
projectSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ featured: true, status: 'published' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username fullName avatar');
};

// Static method to get projects by category
projectSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ category, status: 'published' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username fullName avatar');
};

module.exports = mongoose.model('Project', projectSchema);
