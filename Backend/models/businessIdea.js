const mongoose = require('mongoose');

const businessIdeaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    minlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Technology/Software',
      'Healthcare',
      'Education',
      'Finance',
      'E-commerce',
      'Agriculture',
      'Renewable Energy',
      'Transportation',
      'Food & Beverage',
      'Real Estate',
      'Entertainment',
      'Other'
    ]
  },
  targetMarket: {
    type: String,
    required: true
  },
  revenueModel: {
    type: String,
    required: true
  },
  teamSize: {
    type: String,
    enum: ['Just Me', '2-3 People', '4-5 People', '6-10 People', '11+ People']
  },
  currentStage: {
    type: String,
    required: true,
    enum: [
      'Idea Stage',
      'Research & Development',
      'Prototype',
      'Beta Testing',
      'Early Revenue',
      'Growth Stage',
      'Established Business'
    ]
  },
  fundingNeeded: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  additionalInfo: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
businessIdeaSchema.index({ userId: 1 });
businessIdeaSchema.index({ status: 1 });
businessIdeaSchema.index({ category: 1 });
businessIdeaSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('BusinessIdea', businessIdeaSchema);
