// models/ScreenshotHash.js
const mongoose = require('mongoose');

const screenshotHashSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  transactionId: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['uploaded', 'verified', 'rejected'],
    default: 'uploaded'
  }
}, {
  timestamps: true
});

// Index for efficient queries
screenshotHashSchema.index({ hash: 1, status: 1 });
screenshotHashSchema.index({ userId: 1, uploadedAt: -1 });
screenshotHashSchema.index({ transactionId: 1 });

// Static method to check if screenshot hash exists
screenshotHashSchema.statics.findByHash = function(hash) {
  return this.findOne({ hash: hash });
};

// Static method to check for duplicate uploads by user
screenshotHashSchema.statics.findUserRecentUploads = function(userId, hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    userId: userId, 
    uploadedAt: { $gte: cutoffTime } 
  });
};

module.exports = mongoose.model('ScreenshotHash', screenshotHashSchema);
