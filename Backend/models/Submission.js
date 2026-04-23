const mongoose = require('mongoose');

/**
 * Professional Unified Submission Model
 * Single source of truth for all submission types
 * Follows enterprise-grade patterns and data consistency
 */

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'code', 'other'],
    default: 'document'
  }
}, { timestamps: true });

const testResultSchema = new mongoose.Schema({
  testCaseIndex: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  actualOutput: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: false
  },
  memoryUsage: {
    type: Number,
    required: false
  }
}, { timestamps: true });

const submissionContentSchema = new mongoose.Schema({
  // For project-based submissions (weekly challenges)
  githubUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/github\.com\/.+/.test(v);
      },
      message: 'Invalid GitHub URL format'
    }
  },
  liveUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid live URL format'
    }
  },
  description: {
    type: String,
    required: false,
    maxlength: 2000
  },
  files: [fileSchema],
  
  // For code-based submissions (daily challenges)
  code: {
    type: String,
    required: false,
    maxlength: 50000
  },
  language: {
    type: String,
    required: false,
    enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'ruby', 'php', 'go', 'rust', 'typescript', 'other'],
    default: 'javascript'
  },
  testResults: [testResultSchema],
  
  // Common metadata
  screenshots: [fileSchema],
  notes: {
    type: String,
    maxlength: 1000
  }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  // Core identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  challengeType: {
    type: String,
    required: true,
    enum: ['weekly', 'daily', 'business', 'mentorship', 'hackathon', 'competition'],
    index: true
  },
  
  // Submission content (polymorphic based on challenge type)
  content: {
    type: submissionContentSchema,
    required: true
  },
  
  // Status and review information
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'reviewed', 'under_review'],
    default: 'pending',
    index: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  feedback: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  reviewComments: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  
  // Ranking and evaluation criteria
  rankingCriteria: {
    codeQuality: {
      type: Number,
      min: 0,
      max: 25,
      default: 0
    },
    functionality: {
      type: Number,
      min: 0,
      max: 25,
      default: 0
    },
    creativity: {
      type: Number,
      min: 0,
      max: 25,
      default: 0
    },
    documentation: {
      type: Number,
      min: 0,
      max: 25,
      default: 0
    }
  },
  rank: {
    type: String,
    default: ''
  },
  
  // Review tracking
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  reviewHistory: [{
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    previousStatus: String,
    newStatus: String,
    feedback: String,
    score: Number,
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Performance metrics
  metadata: {
    completionTime: {
      type: Number, // in seconds
      required: false
    },
    hintsUsed: {
      type: Number,
      min: 0,
      default: 0
    },
    attempts: {
      type: Number,
      min: 1,
      default: 1
    },
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100,
      required: false
    },
    autoGraded: {
      type: Boolean,
      default: false
    }
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Soft delete and archiving
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date,
    required: false
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for enhanced functionality
submissionSchema.virtual('isLate').get(function() {
  // This would be populated based on challenge deadline
  return false; // Placeholder - would need challenge reference
});

submissionSchema.virtual('reviewDuration').get(function() {
  if (!this.reviewedAt || !this.submittedAt) return null;
  return this.reviewedAt - this.submittedAt;
});

// Indexes for performance optimization
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ challengeId: 1, status: 1 });
submissionSchema.index({ challengeType: 1, status: 1, submittedAt: -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });
submissionSchema.index({ score: -1, submittedAt: -1 });

// Pre-save middleware
submissionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static methods for common queries
submissionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isArchived: { $ne: true } };
  if (options.challengeType) query.challengeType = options.challengeType;
  if (options.status) query.status = options.status;
  return this.find(query).populate('userId', 'fullName username avatar email');
};

submissionSchema.statics.findByChallenge = function(challengeId, options = {}) {
  const query = { challengeId, isArchived: { $ne: true } };
  if (options.status) query.status = options.status;
  return this.find(query).populate('userId', 'fullName username avatar email');
};

submissionSchema.statics.getStats = function(filters = {}) {
  const matchStage = { isArchived: { $ne: true } };
  if (filters.challengeType) matchStage.challengeType = filters.challengeType;
  if (filters.status) matchStage.status = filters.status;
  if (filters.startDate || filters.endDate) {
    matchStage.submittedAt = {};
    if (filters.startDate) matchStage.submittedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.submittedAt.$lte = new Date(filters.endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$challengeType',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        avgScore: { $avg: '$score' },
        avgCompletionTime: { $avg: '$metadata.completionTime' }
      }
    }
  ]);
};

// Instance methods
submissionSchema.methods.addReview = function(reviewData) {
  this.reviewHistory.push({
    reviewedBy: reviewData.reviewedBy,
    previousStatus: this.status,
    newStatus: reviewData.status,
    feedback: reviewData.feedback,
    score: reviewData.score,
    reviewedAt: new Date()
  });
  
  this.status = reviewData.status;
  this.feedback = reviewData.feedback;
  this.score = reviewData.score;
  this.reviewedBy = reviewData.reviewedBy;
  this.reviewedAt = new Date();
  
  return this.save();
};

submissionSchema.methods.archive = function(archivedBy) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = archivedBy;
  return this.save();
};

module.exports = mongoose.model('Submission', submissionSchema);
