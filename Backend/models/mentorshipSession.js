const mongoose = require('mongoose');

const mentorshipSessionSchema = new mongoose.Schema({
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60, // minutes
    min: 30,
    max: 180
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  sessionType: {
    type: String,
    enum: ['video_call', 'chat', 'code_review', 'career_guidance'],
    default: 'video_call'
  },
  meetingLink: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  mentorNotes: {
    type: String,
    default: ''
  },
  rating: {
    menteeRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    menteeFeedback: {
      type: String,
      default: ''
    },
    mentorRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    mentorFeedback: {
      type: String,
      default: ''
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: {
      type: String,
      default: null
    }
  },
  reminders: [{
    type: Date,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
mentorshipSessionSchema.index({ mentee: 1, status: 1 });
mentorshipSessionSchema.index({ mentor: 1, status: 1 });
mentorshipSessionSchema.index({ scheduledTime: 1, status: 1 });

// Update the updatedAt field before saving
mentorshipSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate recording link for completed sessions
  if (this.status === 'completed' && !this.meetingLink) {
    this.meetingLink = `https://meet.codermeet.com/session/${this._id}`;
  }
  
  next();
});

// Virtual for formatted scheduled time
mentorshipSessionSchema.virtual('formattedScheduledTime').get(function() {
  return this.scheduledTime.toLocaleString();
});

// Virtual for session duration in hours
mentorshipSessionSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Method to check if session is upcoming
mentorshipSessionSchema.methods.isUpcoming = function() {
  return this.scheduledTime > new Date() && this.status === 'scheduled';
};

// Method to check if session can be cancelled
mentorshipSessionSchema.methods.canBeCancelled = function() {
  const cancellationDeadline = new Date(this.scheduledTime);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);
  return new Date() < cancellationDeadline && ['pending', 'scheduled'].includes(this.status);
};

// Static method to find upcoming sessions for a user
mentorshipSessionSchema.statics.findUpcomingForUser = function(userId) {
  return this.find({
    $or: [
      { mentee: userId },
      { mentor: userId }
    ],
    status: 'scheduled',
    scheduledTime: { $gt: new Date() }
  }).populate('mentee mentor', 'name username email avatar');
};

// Static method to find session history for a user
mentorshipSessionSchema.statics.findHistoryForUser = function(userId, limit = 10) {
  return this.find({
    $or: [
      { mentee: userId },
      { mentor: userId }
    ],
    status: { $in: ['completed', 'cancelled'] }
  })
  .sort({ scheduledTime: -1 })
  .limit(limit)
  .populate('mentee mentor', 'name username email avatar');
};

module.exports = mongoose.model('MentorshipSession', mentorshipSessionSchema);
