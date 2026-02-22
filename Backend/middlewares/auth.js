// middlewares/auth.js
const jwt = require("jsonwebtoken");

// Validate JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

module.exports = (req, res, next) => {
    
  const header = req.headers.authorization;
  
  if (!header) {
        return res.status(401).json({ message: "Authorization required" });
  }

  const parts = header.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ message: "Authorization required" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id: user._id, iat, exp }
    next();
  } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
  }
};
