const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  expertise: [{
    type: String,
    required: true,
    trim: true
  }],
  experience: {
    years: {
      type: Number,
      required: true,
      min: 1
    },
    level: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'principal'],
      required: true
    },
    company: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    }
  },
  availability: {
    timezone: {
      type: String,
      required: true
    },
    workingHours: {
      start: {
        type: String,
        required: true
      },
      end: {
        type: String,
        required: true
      }
    },
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    }],
    maxSessionsPerDay: {
      type: Number,
      default: 3,
      min: 1,
      max: 8
    }
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'ETB']
    },
    sessionTypes: [{
      type: {
        type: String,
        enum: ['video_call', 'chat', 'code_review', 'career_guidance'],
        required: true
      },
      duration: {
        type: Number,
        required: true,
        min: 30,
        max: 180
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in hours
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: {
      type: Date,
      default: null
    },
    verificationDocuments: [{
      type: String,
      required: true
    }],
    linkedinProfile: {
      type: String,
      trim: true
    },
    githubProfile: {
      type: String,
      trim: true
    },
    portfolio: {
      type: String,
      trim: true
    }
  },
  preferences: {
    sessionTypes: [{
      type: String,
      enum: ['video_call', 'chat', 'code_review', 'career_guidance']
    }],
    skillLevels: [{
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }],
    languages: [{
      type: String,
      required: true
    }],
    topics: [{
      type: String,
      required: true
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'on_leave'],
    default: 'active'
  },
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
mentorSchema.index({ 'expertise': 1 });
mentorSchema.index({ 'status': 1 });
mentorSchema.index({ 'stats.averageRating': -1 });
mentorSchema.index({ 'pricing.hourlyRate': 1 });

// Update the updatedAt field before saving
mentorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full name
mentorSchema.virtual('fullName').get(function() {
  return this.user.name || this.user.username;
});

// Virtual for availability status
mentorSchema.virtual('isAvailable').get(function() {
  return this.status === 'active';
});

// Method to check if mentor is available at specific time
mentorSchema.methods.isAvailableAt = function(date) {
  const dayOfWeek = date.toLocaleLowerCase('en-US', { weekday: 'long' });
  const hour = date.getHours();
  
  if (!this.availability.availableDays.includes(dayOfWeek)) {
    return false;
  }
  
  const startHour = parseInt(this.availability.workingHours.start.split(':')[0]);
  const endHour = parseInt(this.availability.workingHours.end.split(':')[0]);
  
  return hour >= startHour && hour <= endHour;
};

// Method to update rating
mentorSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.stats.totalRatings + 1;
  const totalRatingPoints = (this.stats.averageRating * this.stats.totalRatings) + newRating;
  this.stats.averageRating = totalRatingPoints / totalRatings;
  this.stats.totalRatings = totalRatings;
  return this.save();
};

// Static method to find available mentors
mentorSchema.statics.findAvailable = function(filters = {}) {
  const query = { status: 'active' };
  
  if (filters.expertise) {
    query.expertise = { $in: filters.expertise };
  }
  
  if (filters.maxPrice) {
    query['pricing.hourlyRate'] = { $lte: filters.maxPrice };
  }
  
  if (filters.minRating) {
    query['stats.averageRating'] = { $gte: filters.minRating };
  }
  
  return this.find(query)
    .populate('user', 'name username email avatar')
    .sort({ 'stats.averageRating': -1, 'stats.totalSessions': -1 });
};

// Static method to get top mentors
mentorSchema.statics.getTopMentors = function(limit = 10) {
  return this.find({ status: 'active' })
    .populate('user', 'name username email avatar')
    .sort({ 'stats.averageRating': -1, 'stats.completedSessions': -1 })
    .limit(limit);
};

module.exports = mongoose.model('Mentor', mentorSchema);
