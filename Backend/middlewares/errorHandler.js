// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Server error" });
}

module.exports = { errorHandler };
