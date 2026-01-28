// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Strict rate limiter for admin routes
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 200 to 1000 requests per windowMs
  message: { success: false, message: "Too many admin requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: false,
  skipFailedRequests: false,

  // ✅ Safe key generator (IPv4 + IPv6)
  keyGenerator: (req, res) => {
    if (req.user) {
      return `admin-${req.user.id}`;
    }

    // Use built-in IPv6-safe generator
    return rateLimit.ipKeyGenerator(req, res);
  }
});

// Very strict rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  adminRateLimiter,
  loginRateLimiter,
};
