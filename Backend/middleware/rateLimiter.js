const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for payment verification uploads
const paymentUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 payment uploads per hour
  message: {
    success: false,
    message: 'Too many payment verification attempts. Please try again later.',
    error: 'PAYMENT_UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to use email if available, otherwise IP
  keyGenerator: (req) => {
    // Try to get email from request body or user
    const email = req.body?.email || req.user?.email;
    return email ? `email:${email}` : ipKeyGenerator(req);
  },
  // Skip successful requests from counting
  skipSuccessfulRequests: false,
  // Store rate limit data in memory (for production, consider Redis)
  store: undefined,
});

// Rate limiter for OCR processing (more restrictive)
const ocrProcessingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 OCR processes per hour
  message: {
    success: false,
    message: 'Too many OCR processing requests. Please try again later.',
    error: 'OCR_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || req.user?.email;
    return email ? `email:${email}` : ipKeyGenerator(req);
  }
});

// Rate limiter for duplicate checks
const duplicateCheckLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 duplicate checks per 5 minutes
  message: {
    success: false,
    message: 'Too many verification attempts. Please slow down.',
    error: 'DUPLICATE_CHECK_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads (separate from payment uploads)
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads. Please try again later.',
    error: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a more sophisticated rate limiter for payment verification
const createPaymentVerificationLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 60 * 1000, // 1 hour default
    max: options.max || 5, // 5 uploads per hour default
    message: {
      success: false,
      message: options.message || 'Too many payment verification attempts. Please try again later.',
      error: options.error || 'PAYMENT_VERIFICATION_RATE_LIMIT_EXCEEDED',
      retryAfter: options.retryAfter || '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => {
      // Priority order: email from body, authenticated user email, IP address
      const email = req.body?.email || req.user?.email;
      return email ? `payment:${email}` : `payment_ip:${ipKeyGenerator(req)}`;
    }),
    // Custom skip function
    skip: options.skip || ((req) => {
      // Don't rate limit admin users
      return req.user?.role === 'admin';
    }),
    // Custom handler for when limit is reached
    handler: options.handler || ((req, res) => {
      const email = req.body?.email || req.user?.email;
      console.log('🚫 [RATE_LIMIT] Payment verification rate limit exceeded:', {
        ip: req.ip,
        email: email || 'anonymous',
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      res.status(429).json({
        success: false,
        message: options.message || 'Too many payment verification attempts. Please try again later.',
        error: options.error || 'PAYMENT_VERIFICATION_RATE_LIMIT_EXCEEDED',
        retryAfter: options.retryAfter || '1 hour',
        debug: {
          limitExceeded: true,
          retryAfter: options.retryAfter || '1 hour'
        }
      });
    })
  });
};

// Rate limiter for API endpoints in general
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
    error: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sensitive operations (like admin functions)
const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 sensitive operations per 15 minutes
  message: {
    success: false,
    message: 'Too many sensitive operations attempted. Please try again later.',
    error: 'SENSITIVE_OPERATION_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Always use user ID for sensitive operations if available
    return req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`;
  }
});

module.exports = {
  generalLimiter,
  paymentUploadLimiter,
  ocrProcessingLimiter,
  duplicateCheckLimiter,
  fileUploadLimiter,
  createPaymentVerificationLimiter,
  apiLimiter,
  sensitiveOperationLimiter
};
