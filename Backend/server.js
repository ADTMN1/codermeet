// server.js
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const challengeRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const paymentRoutes = require('./routes/payment');
const resourceRoutes = require('./routes/resources');
const { errorHandler } = require("./middlewares/errorHandler");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// CORS Configuration
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:5173").split(",");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Apply CORS middleware first
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.chapa.co"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Logging (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Body parser with increased limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 payment attempts per 15 minutes
  message: "Too many payment attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/challenges", challengeRoutes); // Admin challenge routes
app.use("/api/challenges", challengeRoutes); // Public challenge routes
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/resources", resourceRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  // Server started successfully
});