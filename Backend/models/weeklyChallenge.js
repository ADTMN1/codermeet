const mongoose = require('mongoose');

const weeklyChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Algorithms', 'Data Structures', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'AI/ML', 'Security', 'Database']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard', 'Expert']
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  deliverables: [{
    type: String,
    trim: true
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'documentation', 'github', 'other']
    }
  }],
  
  // Weekly contest specific fields
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Contest settings
  maxParticipants: {
    type: Number,
    default: null // null = unlimited
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  prizePool: {
    type: Number,
    default: 0
  },
  winnerCount: {
    type: Number,
    default: 3 // Top 3 winners by default
  },
  
  // Status management
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Participants and submissions
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSubmissionAt: Date
  }],
  submissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    githubUrl: String,
    liveUrl: String,
    description: String,
    screenshots: [String],
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending'
    },
    score: {
      type: Number,
      default: 0
    },
    reviewComments: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  }],
  
  // Winners and results
  winners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rank: Number,
    score: Number,
    prizeAmount: Number,
    announcedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Judging criteria
  judgingCriteria: [{
    name: String,
    description: String,
    maxScore: Number,
    weight: Number // percentage weight
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
weeklyChallengeSchema.index({ weekNumber: 1, year: 1 }, { unique: true });
weeklyChallengeSchema.index({ status: 1 });
weeklyChallengeSchema.index({ startDate: 1 });
weeklyChallengeSchema.index({ endDate: 1 });
weeklyChallengeSchema.index({ category: 1 });
weeklyChallengeSchema.index({ difficulty: 1 });
weeklyChallengeSchema.index({ 'participants.user': 1 });
weeklyChallengeSchema.index({ 'submissions.user': 1 });

// Virtual for checking if contest is currently active
weeklyChallengeSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

// Virtual for time remaining
weeklyChallengeSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (this.endDate <= now) return 0;
  return Math.floor((this.endDate - now) / (1000 * 60 * 60 * 24)); // days remaining
});

// Pre-save middleware to update week number if not provided
// weeklyChallengeSchema.pre('save', function(next) {
//   if (!this.weekNumber || !this.year) {
//     const start = new Date(this.startDate);
//     this.weekNumber = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7);
//     this.year = start.getFullYear();
//   }
//   next();
// });

module.exports = mongoose.model('WeeklyChallenge', weeklyChallengeSchema);
