// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err); // log server-side
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Server error" });
}

module.exports = { errorHandler };
