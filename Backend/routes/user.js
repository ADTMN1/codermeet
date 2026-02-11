const express = require("express");
const router = express.Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middlewares/auth");
const userController = require("../controllers/userController");
const User = require("../models/user");

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

// Points statistics routes
router.get("/points-stats/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data
    const user = await User.findById(userId).select('points pointsAwarded createdAt activity');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate points this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const pointsThisMonth = (user.pointsAwarded || [])
      .filter(award => new Date(award.awardedAt) >= thisMonth)
      .reduce((sum, award) => sum + award.points, 0);

    // Calculate points this week
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    
    const pointsThisWeek = (user.pointsAwarded || [])
      .filter(award => new Date(award.awardedAt) >= thisWeek)
      .reduce((sum, award) => sum + award.points, 0);

    // Calculate current rank
    const rankSystem = [
      { name: 'Bronze', minPoints: 0 },
      { name: 'Silver', minPoints: 500 },
      { name: 'Gold', minPoints: 1500 },
      { name: 'Platinum', minPoints: 3000 },
      { name: 'Diamond', minPoints: 5000 }
    ];

    const currentRank = rankSystem
      .slice()
      .reverse()
      .find(rank => user.points >= rank.minPoints) || rankSystem[0];

    const nextRank = rankSystem[rankSystem.indexOf(currentRank) + 1];
    const pointsToNextRank = nextRank ? nextRank.minPoints - user.points : 0;

    res.json({
      success: true,
      data: {
        totalPoints: user.points || 0,
        pointsThisMonth,
        pointsThisWeek,
        currentRank: currentRank.name,
        nextRank: nextRank ? nextRank.name : currentRank.name,
        pointsToNextRank
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's point activities
router.get("/point-activities/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    // Get user with points awarded
    const user = await User.findById(userId).select('pointsAwarded');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get recent point activities
    const activities = (user.pointsAwarded || [])
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .slice(0, parseInt(limit))
      .map(activity => ({
        id: activity._id,
        type: getActivityType(activity.reason),
        description: activity.reason,
        points: activity.points,
        date: activity.awardedAt,
        icon: getActivityIcon(activity.reason)
      }));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
function getActivityType(reason) {
  if (reason.includes('daily challenge')) return 'daily_challenge';
  if (reason.includes('Challenge completion')) return 'weekly_challenge';
  if (reason.includes('streak')) return 'streak_bonus';
  if (reason.includes('business')) return 'business_idea';
  if (reason.includes('mentorship')) return 'mentorship';
  if (reason.includes('community')) return 'community_help';
  return 'other';
}

function getActivityIcon(reason) {
  if (reason.includes('daily challenge')) return 'FaCode';
  if (reason.includes('Challenge completion')) return 'FaRocket';
  if (reason.includes('streak')) return 'FaFire';
  if (reason.includes('business')) return 'FaLightbulb';
  if (reason.includes('mentorship')) return 'FaGraduationCap';
  if (reason.includes('community')) return 'FaUsers';
  return 'FaStar';
}

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

// Notification routes
router.get("/notifications", authMiddleware, userController.getNotifications);
router.get("/notifications/count", authMiddleware, userController.getUnreadNotificationCount);
router.patch("/notifications/:id/read", authMiddleware, userController.markNotificationAsRead);
router.patch("/notifications/read-all", authMiddleware, userController.markAllNotificationsAsRead);
router.delete("/notifications/:id", authMiddleware, userController.deleteNotification);

// Check if email or username exists
router.get("/check-user", checkUserLimiter, userController.checkUser);

module.exports = router;
