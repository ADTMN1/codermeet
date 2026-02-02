const mongoose = require('mongoose');

const dailySubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyChallenge',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript'
  },
  testResults: [{
    testCaseIndex: Number,
    passed: Boolean,
    input: String,
    expectedOutput: String,
    actualOutput: String,
    executionTime: Number,
    memoryUsage: Number
  }],
  score: {
    total: Number,
    speed: Number,
    efficiency: Number,
    correctness: Number,
    breakdown: {
      timeBonus: Number,
      efficiencyBonus: Number,
      correctnessScore: Number
    }
  },
  completionTime: {
    startedAt: Date,
    submittedAt: Date,
    totalSeconds: Number
  },
  hintsUsed: {
    type: Number,
    default: 0
  },
  solutionViewed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['attempting', 'submitted', 'passed', 'failed'],
    default: 'attempting'
  },
  rank: {
    type: Number,
    default: null
  },
  prizeEligible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
dailySubmissionSchema.index({ userId: 1, date: -1 });
dailySubmissionSchema.index({ challengeId: 1, score: -1 });
dailySubmissionSchema.index({ date: 1, score: -1 });

module.exports = mongoose.model('DailySubmission', dailySubmissionSchema);
