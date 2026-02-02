const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number,
    default: 30 // minutes
  },
  maxPoints: {
    type: Number,
    default: 100
  },
  scoringCriteria: {
    speed: {
      weight: Number,
      description: String
    },
    efficiency: {
      weight: Number,
      description: String
    },
    correctness: {
      weight: Number,
      description: String
    }
  },
  hint: String,
  solution: String,
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  testCases: [{
    input: String,
    expectedOutput: String,
    weight: {
      type: Number,
      default: 1
    }
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  prizes: {
    first: {
      amount: Number,
      type: {
        type: String,
        enum: ['mobile_card', 'cash', 'other'],
        default: 'mobile_card'
      },
      currency: {
        type: String,
        default: 'ETB'
      }
    },
    second: {
      amount: Number,
      type: {
        type: String,
        enum: ['mobile_card', 'cash', 'other'],
        default: 'mobile_card'
      },
      currency: {
        type: String,
        default: 'ETB'
      }
    },
    third: {
      amount: Number,
      type: {
        type: String,
        enum: ['mobile_card', 'cash', 'other'],
        default: 'mobile_card'
      },
      currency: {
        type: String,
        default: 'ETB'
      }
    }
  },
  winners: [{
    rank: Number,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    completionTime: Number,
    prizeStatus: {
      type: String,
      enum: ['pending', 'claimed', 'expired'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
dailyChallengeSchema.index({ date: -1 });
dailyChallengeSchema.index({ isActive: 1 });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
