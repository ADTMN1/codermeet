// server.js
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middlewares
app.use(helmet());

// Logging (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Body parser
app.use(express.json());

// CORS - restrict in production by setting FRONTEND_URL in .env
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000"
).split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Global rate limiter (basic)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Routes
app.use("/api/auth", authRoutes);

// Health
app.get("/", (req, res) => res.send("Backend is running!"));

// Global error handler (must be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
