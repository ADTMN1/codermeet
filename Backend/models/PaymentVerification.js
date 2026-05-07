const mongoose = require('mongoose');

const PaymentVerificationSchema = new mongoose.Schema({
  // Transaction details extracted from OCR
  transactionId: {
    type: String,
    required: false, // Will be populated after OCR
    trim: true,
    default: 'PENDING' // Default value until OCR completes
  },
  
  // Payment amount and currency
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ETB',
    enum: ['ETB', 'USD', 'EUR']
  },
  
  // Payer and payee information
  payerName: {
    type: String,
    required: false, // Will be populated after OCR
    trim: true,
    default: 'Unknown'
  },
  payeeName: {
    type: String,
    required: false, // Will be populated after OCR
    trim: true,
    default: 'Unknown'
  },
  
  // Transaction date
  transactionDate: {
    type: Date,
    required: false, // Will be populated after OCR
    default: Date.now
  },
  
  // Plan information
  plan: {
    type: String,
    required: true,
    enum: ['trial', 'basic', 'premium']
  },
  
  // User information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  // File information
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileHash: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  
  // OCR extraction results
  extractedText: {
    type: String,
    required: false, // Will be populated after OCR
    default: ''
  },
  ocrConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Verification status
  status: {
    type: String,
    required: true,
    enum: ['processing', 'verified', 'rejected', 'manual_review'],
    default: 'processing'
  },
  verified: {
    type: Boolean,
    default: false
  },
  
  // Verification details
  verificationId: {
    type: String,
    unique: true,
    sparse: true
  },
  verificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Issues found during verification
  issues: [{
    type: {
      type: String,
      enum: [
        'MAJOR_AMOUNT_MISMATCH',
        'RECIPIENT_MISMATCH', 
        'INVALID_TRANSACTION_ID',
        'OLD_TRANSACTION',
        'MISSING_TRANSACTION_ID',
        'AMOUNT_MISMATCH',
        'INVALID_DATE',
        'MISSING_RECIPIENT',
        'LOW_CONFIDENCE',
        'DUPLICATE_TRANSACTION',
        'INVALID_CURRENCY',
        'MISSING_AMOUNT',
        'CORRUPTED_IMAGE',
        'TEXT_EXTRACTION_FAILED',
        'VERIFICATION_TIMEOUT',
        'SYSTEM_ERROR',
        'ERROR',
        'WARNING',
        'INFO'
      ]
    },
    severity: {
      type: String,
      enum: ['ERROR', 'WARNING', 'INFO'],
      default: 'INFO'
    },
    message: String,
    field: String
  }],
  
  // Rejection reason if applicable
  rejectionReason: {
    type: String
  },
  
  // Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
PaymentVerificationSchema.index({ transactionId: 1 });
PaymentVerificationSchema.index({ email: 1 });
PaymentVerificationSchema.index({ status: 1 });
PaymentVerificationSchema.index({ createdAt: -1 });
PaymentVerificationSchema.index({ fileHash: 1 });

// Compound index for duplicate detection
PaymentVerificationSchema.index({ transactionId: 1, email: 1 });


// Static methods for common queries
PaymentVerificationSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transactionId });
};

PaymentVerificationSchema.statics.findByEmail = function(email) {
  return this.find({ email }).sort({ createdAt: -1 });
};

PaymentVerificationSchema.statics.findByFileHash = function(fileHash) {
  return this.findOne({ fileHash });
};

PaymentVerificationSchema.statics.findDuplicates = function(transactionId, email) {
  return this.findOne({
    $or: [
      { transactionId },
      { email, status: 'verified' }
    ]
  });
};

// Instance methods
PaymentVerificationSchema.methods.markAsVerified = function(verificationId, score) {
  this.status = 'verified';
  this.verified = true;
  this.verificationId = verificationId;
  this.verificationScore = score;
  this.verifiedAt = new Date();
  return this.save();
};

PaymentVerificationSchema.methods.markAsRejected = function(reason, issues) {
  this.status = 'rejected';
  this.verified = false;
  this.rejectionReason = reason;
  this.issues = issues || [];
  return this.save();
};

PaymentVerificationSchema.methods.markForManualReview = function(issues) {
  this.status = 'manual_review';
  this.verified = false;
  this.issues = issues || [];
  return this.save();
};

module.exports = mongoose.model('PaymentVerification', PaymentVerificationSchema);
