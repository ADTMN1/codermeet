// middlewares/csrfProtection.js
const crypto = require('crypto');

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store CSRF tokens in memory (for production, use Redis)
const csrfTokens = new Map();

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and authentication routes
  if (req.method === 'GET' || req.path.includes('/auth/')) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken || req.cookies?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }

  next();
};

// CSRF token middleware for API routes
const csrfTokenMiddleware = (req, res, next) => {
  // Skip CSRF for GET requests and authentication routes
  if (req.method === 'GET' || req.path.includes('/auth/')) {
    return next();
  }
  
  csrfProtection(req, res, next);
};

// Send CSRF token to client
const getCsrfToken = (req, res) => {
  const token = generateCSRFToken();
  
  // Store token in session or cookie
  if (req.session) {
    req.session.csrfToken = token;
  }
  
  // Also set as cookie for client-side access
  res.cookie('csrfToken', token, {
    httpOnly: false, // Allow JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({ csrfToken: token });
};

// Clean up expired tokens periodically
setInterval(() => {
  csrfTokens.clear(); // In production, implement proper cleanup
}, 24 * 60 * 60 * 1000); // Clean every 24 hours

module.exports = {
  csrfProtection,
  csrfTokenMiddleware,
  getCsrfToken,
  generateCSRFToken
};
