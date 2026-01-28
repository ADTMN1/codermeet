// routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth");
const { adminRateLimiter } = require("../middlewares/rateLimiter");

// Apply admin authentication and rate limiting to all routes
router.use(adminAuth);
router.use(adminRateLimiter);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/stats", adminController.getUserStats);
router.put("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

// System monitoring routes
router.get("/system/health", adminController.getSystemHealth);
router.get("/system/activity", adminController.getSystemActivity);

module.exports = router;
