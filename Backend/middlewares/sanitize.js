// middlewares/sanitize.js
const mongoSanitize = require("mongo-sanitize");

// Recursively sanitize all strings in object
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      obj[key] = mongoSanitize(val);
    } else if (Array.isArray(val)) {
      obj[key] = val.map((v) => (typeof v === "string" ? mongoSanitize(v) : v));
    } else if (typeof val === "object" && val !== null) {
      sanitizeObject(val);
    }
  }
}

module.exports = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};
