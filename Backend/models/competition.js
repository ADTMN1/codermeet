const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  deadline: {
    type: Date,
    required: true
  },
  prize: {
    type: String,
    required: true,
    trim: true
  },
  rules: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxSubmissions: {
    type: Number,
    default: null // null means unlimited
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for finding active competitions
competitionSchema.index({ isActive: 1, deadline: 1 });

module.exports = mongoose.model('Competition', competitionSchema);
