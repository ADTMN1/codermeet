const express = require("express");
const router = express.Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middlewares/auth");
const userController = require("../controllers/userController");

// Multer setup for avatar uploads
const storage = multer.diskStorage({});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Rate limiters
const profileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, please try again later" },
});

// Routes

// Get current logged-in user
router.get("/me", authMiddleware, userController.me);

// Get user's projects
router.get("/projects", authMiddleware, userController.getUserProjects);

// Update full profile (with optional avatar)
router.put(
  "/profile",
  authMiddleware,
  profileLimiter,
  upload.single("avatar"),
  userController.updateProfile
);

// Update profile picture only
router.put(
  "/profile/avatar",
  authMiddleware,
  profileLimiter,
  upload.single("avatar"),
  userController.updateProfilePicture
);

// Check if email or username exists
router.get("/check-user", checkUserLimiter, userController.checkUser);

module.exports = router;
