const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 5,
    min: 2,
    max: 20
  },
  status: {
    type: String,
    enum: ['active', 'forming', 'seeking-members', 'completed'],
    default: 'forming'
  },
  skillsNeeded: [{
    type: String,
    trim: true
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
teamSchema.index({ leaderId: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Team', teamSchema);
