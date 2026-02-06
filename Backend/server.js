// server.js
require("dotenv").config();
const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
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
const businessIdeaRoutes = require('./routes/businessIdeas');
const mentorshipRoutes = require('./routes/mentorship');
const messageRoutes = require('./routes/messages');
const dailyChallengeRoutes = require('./routes/dailyChallenge');
const adminChallengeRoutes = require('./routes/adminChallenges');
const twoFactorRoutes = require('./routes/twoFactor');
const sessionRoutes = require('./routes/sessions');

// Import models
const User = require('./models/user');
const Submission = require('./models/submission');
const DailySubmission = require('./models/dailySubmission');
const BusinessIdea = require('./models/businessIdea');
const Announcement = require('./models/announcement');
const Comment = require('./models/comment');
const Team = require('./models/team');

const { errorHandler } = require("./middlewares/errorHandler");
const socketHandler = require('./socket/socketHandler');
const uploadSecurity = require('./middleware/uploadSecurity');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// Body parser with reasonable limits for security
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// Global rate limiter - Professional settings for production
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes (reasonable for production)
  message: {
    error: "Too many requests, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from rate limiting
  skipSuccessfulRequests: false,
  // Skip failed requests from rate limiting  
  skipFailedRequests: false,
  // Add custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    });
  }
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
app.use("/api/admin/challenges", adminChallengeRoutes); // AI Challenge Generation
app.use("/api/challenges", challengeRoutes); // Public challenge routes
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/daily-challenge", dailyChallengeRoutes);
app.use("/api/2fa", twoFactorRoutes); // 2FA routes
app.use("/api/sessions", sessionRoutes); // Session management routes
app.use("/api/business-ideas", businessIdeaRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/messages", messageRoutes); // Message routes (mounted at /api to handle /api/challenges/:id/messages)

// Error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.IO server initialized`);
});