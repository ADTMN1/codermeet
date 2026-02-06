const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge', // Generic challenge reference
    required: false
  },
  challengeType: {
    type: String,
    enum: ['weekly', 'daily', 'business-competition', 'personal', 'mentorship'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  githubUrl: {
    type: String,
    required: true
  },
  liveUrl: {
    type: String,
    required: false
  },
  technologies: [{
    type: String,
    required: false
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    required: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ challengeType: 1, status: 1 });
submissionSchema.index({ status: 1, score: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
