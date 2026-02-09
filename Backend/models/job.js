const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote', 'freelance'],
    required: true
  },
  experience: {
    type: String,
    enum: ['entry-level', 'junior', 'mid-level', 'senior', 'lead', 'executive'],
    required: true
  },
  salary: {
    min: {
      type: Number,
      required: false
    },
    max: {
      type: Number,
      required: false
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  skills: [{
    type: String,
    required: true
  }],
  requirements: [{
    type: String,
    required: true
  }],
  responsibilities: [{
    type: String,
    required: true
  }],
  benefits: [{
    type: String
  }],
  applicationDeadline: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'accepted', 'rejected'],
      default: 'pending'
    },
    coverLetter: String,
    resumeUrl: String
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });
jobSchema.index({ isActive: 1, isFeatured: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ applicationDeadline: 1 });

module.exports = mongoose.model('Job', jobSchema);
