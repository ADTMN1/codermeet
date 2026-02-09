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


// Get current logged-in user
router.get("/me", authMiddleware, userController.me);

// Get user profile (including liked jobs)
router.get("/profile", authMiddleware, userController.me);

// Get user's projects
router.get("/projects", authMiddleware, userController.getUserProjects);

// Get community projects (all users' projects)
router.get("/community/projects", authMiddleware, userController.getCommunityProjects);

// Get announcements
router.get("/announcements", authMiddleware, userController.getAnnouncements);

// Get community members
router.get("/members", authMiddleware, userController.getMembers);

// Send connection request
router.post("/connect/:id", authMiddleware, userController.sendConnectionRequest);

// Get user connections
router.get("/connections", authMiddleware, userController.getConnections);

// Send message
router.post("/message/:id", authMiddleware, userController.sendMessage);

// Get teams
router.get("/teams", authMiddleware, userController.getTeams);

// Create team
router.post("/teams", authMiddleware, userController.createTeam);

// Join team
router.post("/teams/:id/join", authMiddleware, userController.joinTeam);

// Leave team
router.post("/teams/:id/leave", authMiddleware, userController.leaveTeam);

// Post a new project
router.post("/projects", authMiddleware, userController.createProject);

// Like a project
router.post("/projects/:id/like", authMiddleware, userController.likeProject);

// Comment on a project
router.post("/projects/:id/comment", authMiddleware, userController.commentProject);

// Get announcement comments
router.get("/announcements/:id/comments", authMiddleware, userController.getAnnouncementComments);

// Like an announcement
router.post("/announcements/:id/like", authMiddleware, userController.likeAnnouncement);

// Comment on an announcement
router.post("/announcements/:id/comment", authMiddleware, userController.commentAnnouncement);

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

// Get user statistics
router.get("/:id/stats", authMiddleware, userController.getUserStats);

// Check if email or username exists
router.get("/check-user", checkUserLimiter, userController.checkUser);

module.exports = router;
