// middlewares/accountLockout.js
const rateLimit = require("express-rate-limit");

// Store login attempts in memory (for production, use Redis)
const loginAttempts = new Map();
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Clean up expired lockouts periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

const checkAccountLockout = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };

  // Check if account is locked
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      message: `Account locked. Try again in ${remainingTime} seconds.`,
      locked: true,
      retryAfter: remainingTime
    });
  }

  // Reset lockout if time has passed
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(ip);
  }

  req.loginAttempts = loginAttempts;
  next();
};

const recordFailedAttempt = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = req.loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };

  attempts.count += 1;

  // Lock account if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_TIME;
  }

  req.loginAttempts.set(ip, attempts);
};

const recordSuccessfulAttempt = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  req.loginAttempts.delete(ip); // Clear attempts on successful login
};

module.exports = {
  checkAccountLockout,
  recordFailedAttempt,
  recordSuccessfulAttempt
};
