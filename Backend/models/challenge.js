// models/Challenge.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  files: [{
    filename: String,
    url: String,
    size: Number
  }],
  githubUrl: String,
  liveDemoUrl: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, { timestamps: true });

const prizeSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true,
    min: 1
  },
  prize: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  awardedAt: Date
}, { timestamps: true });

const challengeSchema = new mongoose.Schema({
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
    enum: ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'AI/ML', 'Blockchain', 'Other']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    required: true
  }],
  deliverables: [{
    type: String,
    required: true
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'documentation', 'tool', 'other']
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: null // null for unlimited
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submissions: [submissionSchema],
  prizes: [prizeSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  image: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  judges: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  evaluationCriteria: [{
    criterion: String,
    weight: {
      type: Number,
      default: 1
    },
    description: String
  }],
  winnerAnnounced: {
    type: Boolean,
    default: false
  },
  winnerAnnouncedAt: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if challenge is active
challengeSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual for days remaining
challengeSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total submissions count
challengeSchema.virtual('totalSubmissions').get(function() {
  return this.submissions.length;
});

// Index for better query performance
challengeSchema.index({ status: 1, startDate: 1, endDate: 1 });
challengeSchema.index({ category: 1, difficulty: 1 });
challengeSchema.index({ featured: 1 });
challengeSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
