// middlewares/auth.js
const jwt = require("jsonwebtoken");

// Validate JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "Authorization required" });

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Authorization required" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id: user._id, iat, exp }
    next();
  } catch (err) {
    // Don't expose specific error details in production
    const message = process.env.NODE_ENV === 'development' 
      ? `Invalid token: ${err.message}` 
      : "Invalid or expired token";
    return res.status(401).json({ message });
  }
};
