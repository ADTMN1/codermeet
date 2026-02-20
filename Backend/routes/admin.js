// routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middlewares/roleBasedAuth");
const { adminRateLimiter } = require("../middlewares/rateLimiter");

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(adminRateLimiter);

// Admin profile routes
router.get("/profile", adminController.getAdminProfile);
router.put("/profile", adminController.updateAdminProfile);
router.put("/change-password", adminController.changeAdminPassword);
router.post("/toggle-2fa", adminController.toggleTwoFactorAuth);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/admins", adminController.getAdminUsers);
router.get("/users/stats", adminController.getUserStats);
router.put("/users/:userId/role", adminController.updateUserRole);
router.put("/users/:userId/promote", adminController.promoteToAdmin);
router.put("/users/:userId/demote", adminController.demoteFromAdmin);
router.delete("/users/:userId", adminController.deleteUser);

// System monitoring routes
router.get("/system/health", adminController.getSystemHealth);
router.get("/system/activity", adminController.getSystemActivity);

module.exports = router;
